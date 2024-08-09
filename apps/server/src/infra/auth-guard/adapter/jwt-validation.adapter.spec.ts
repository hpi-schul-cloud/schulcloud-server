import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { feathersRedis } from '@src/imports-from-feathers';
import { JwtValidationAdapter } from './jwt-validation.adapter';
import RedisMock = require('../../../../../../test/utils/redis/redisMock');

describe('jwt strategy', () => {
	let module: TestingModule;
	let adapter: JwtValidationAdapter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [JwtValidationAdapter],
		}).compile();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		const redisClientMock = new RedisMock();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		feathersRedis.setRedisClient(redisClientMock);

		adapter = module.get(JwtValidationAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when authenticate a user with jwt', () => {
		it('should fail without whitelisted jwt', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			await expect(adapter.isWhitelisted(accountId, jti)).rejects.toThrow(
				'Session was expired due to inactivity - autologout.'
			);
		});
		it('should pass when jwt has been whitelisted', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			await adapter.addToWhitelist(accountId, jti);
			// might fail when we would wait more than JWT_TIMEOUT_SECONDS
			await adapter.isWhitelisted(accountId, jti);
		});
	});
});
