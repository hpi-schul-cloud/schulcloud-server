const mockery = require('mockery');
const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;
const redisMock = require('../../../utils/redis/redisMock');
const whitelist = require('../../../../src/services/authentication/logic/whitelist');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('authentication hooks', () => {
	let redisHelper;
	let addJwtToWhitelist;
	let removeJwtFromWhitelist;
	let configBefore = null;
	let app;
	let server;
	let nestServices;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });

		/* eslint-disable global-require */
		app = await require('../../../../src/app')();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		testObjects = require('../../helpers/testObjects')(app);
		/* eslint-enable global-require */

		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('ioredis', redisMock);
		mockery.registerMock('@hpi-schul-cloud/commons', commons);

		delete require.cache[require.resolve('../../../../src/app')];
		delete require.cache[require.resolve('../../../../src/utils/redis')];
		delete require.cache[require.resolve('../../../services/helpers/testObjects')];
		delete require.cache[require.resolve('../../../services/helpers/services/login')];
		delete require.cache[require.resolve('../../../../src/services/authentication/hooks')];
		/* eslint-disable global-require */
		redisHelper = require('../../../../src/utils/redis');
		({ addJwtToWhitelist, removeJwtFromWhitelist } = require('../../../../src/services/authentication/hooks'));
		/* eslint-enable global-require */

		Configuration.set('REDIS_URI', '//validHost:5555');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);
		redisHelper.initializeRedisClient();
	});

	after(async () => {
		mockery.deregisterAll();
		mockery.disable();
		await testObjects.cleanup();

		delete require.cache[require.resolve('../../../../src/app')];
		delete require.cache[require.resolve('../../../../src/utils/redis')];
		delete require.cache[require.resolve('../../../services/helpers/testObjects')];
		delete require.cache[require.resolve('../../../services/helpers/services/login')];
		delete require.cache[require.resolve('../../../../src/services/authentication/hooks')];

		Configuration.reset(configBefore);
		await server.close();
		await closeNestServices(nestServices);
	});

	it('addJwtToWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(accessToken);
		const result = await addJwtToWhitelist({ result: { accessToken } });
		expect(result).to.not.equal(undefined);
		const redisResult = await redisHelper.redisGetAsync(redisIdentifier);
		const redisTtl = await redisHelper.redisTtlAsync(redisIdentifier);
		expect(redisResult).to.not.eq(undefined);
		expect(redisTtl).to.be.greaterThan(7000);
	});

	it('removeJwtFromWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 7200);
		const result = await removeJwtFromWhitelist({
			params,
		});
		expect(result).to.not.equal(undefined);
		const redisResult = await redisHelper.redisGetAsync(redisIdentifier);
		expect(redisResult).to.eq(undefined);
	});
});
