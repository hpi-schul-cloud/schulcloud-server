import commons from '@hpi-schul-cloud/commons';
import { expect } from 'chai';
import mockery from 'mockery';
import redisMock from '../../../utils/redis/redisMock';
import testObjectsImport from '../../helpers/testObjects';

const { Configuration } = commons;

describe('authentication hooks', function test() {
	this.timeout(20000);
	let redisHelper;
	let addJwtToWhitelist;
	let removeJwtFromWhitelist;
	let configBefore = null;
	let app;
	let server;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });

		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('redis', redisMock);
		mockery.registerMock('@hpi-schul-cloud/commons', commons);

		delete require.cache[require.resolve('../../../../src/app')];
		delete require.cache[require.resolve('../../../../src/utils/redis')];
		delete require.cache[require.resolve('../../../services/helpers/testObjects')];
		delete require.cache[require.resolve('../../../services/helpers/services/login')];
		delete require.cache[require.resolve('../../../../src/services/authentication/hooks')];
		/* eslint-disable global-require */

		redisHelper = await import('../../../../src/utils/redis');
		const appImp = await import('../../../../src/app');
		app = await appImp.default;
		server = await app.listen(0);
		testObjects = testObjectsImport(app);
		({ addJwtToWhitelist, removeJwtFromWhitelist } = await import('../../../../src/services/authentication/hooks'));
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
	});

	it('addJwtToWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;
		const { redisIdentifier } = redisHelper.extractDataFromJwt(accessToken);
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
		const { redisIdentifier } = redisHelper.extractDataFromJwt(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 7200);
		const result = await removeJwtFromWhitelist({
			params,
		});
		expect(result).to.not.equal(undefined);
		const redisResult = await redisHelper.redisGetAsync(redisIdentifier);
		expect(redisResult).to.eq(undefined);
	});
});
