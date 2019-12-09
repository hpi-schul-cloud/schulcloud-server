const mockery = require('mockery');
const { expect } = require('chai');
const redisMock = require('../../../utils/redis/redisMock');

const app = require('../../../../src/app');
const { cleanup, createTestUser } = require('../../../services/helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../../services/helpers/services/login')(app);

describe('authentication hooks', () => {
	let redisHelper;
	let addJwtToWhitelist;
	let removeJwtFromWhitelist;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('redis', redisMock);

		delete require.cache[require.resolve('../../../../src/utils/redis')];
		/* eslint-disable global-require */
		redisHelper = require('../../../../src/utils/redis');
		({ addJwtToWhitelist, removeJwtFromWhitelist } = require('../../../../src/services/authentication/hooks'));
		/* eslint-enable global-require */

		redisHelper.initializeRedisClient({
			Config: { data: { REDIS_URI: '//validHost:6379' } },
		});
	});

	after(async () => {
		mockery.deregisterAll();
		mockery.disable();
		cleanup();
	});

	it('addJwtToWhitelist', async () => {
		const user = await createTestUser();
		const params = await generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;
		const redisIdentifier = redisHelper.getRedisIdentifier(accessToken);
		const result = await addJwtToWhitelist({
			result: { accessToken },
			app: { Config: { data: { REDIS_URI: '//validHost:6379', JWT_TIMEOUT_SECONDS: 7200 } } },
		});
		expect(result).to.not.equal(undefined);
		const redisResult = await redisHelper.redisGetAsync(redisIdentifier);
		const redisTtl = await redisHelper.redisTtlAsync(redisIdentifier);
		expect(redisResult).to.not.eq(undefined);
		expect(redisTtl).to.be.greaterThan(7000);
	});

	it('removeJwtFromWhitelist', async () => {
		const user = await createTestUser();
		const params = await generateRequestParamsFromUser(user);
		const redisIdentifier = redisHelper.getRedisIdentifier(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 7200);
		const result = await removeJwtFromWhitelist({
			params,
		});
		expect(result).to.not.equal(undefined);
		const redisResult = await redisHelper.redisGetAsync(redisIdentifier);
		expect(redisResult).to.eq(undefined);
	});
});
