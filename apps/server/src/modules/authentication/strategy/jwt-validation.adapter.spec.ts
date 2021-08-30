import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { JwtValidationAdapter } from './jwt-validation.adapter';
import RedisMock = require('../../../../../../test/utils/redis/redisMock');
import redis = require('../../../../../../src/utils/redis');

describe('jwt strategy', () => {
	let adapter: JwtValidationAdapter;
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [JwtValidationAdapter],
		}).compile();
		const redisClientMock = RedisMock.createClient();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		redis.setRedisClient(redisClientMock);
		adapter = module.get<JwtValidationAdapter>(JwtValidationAdapter);
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
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
