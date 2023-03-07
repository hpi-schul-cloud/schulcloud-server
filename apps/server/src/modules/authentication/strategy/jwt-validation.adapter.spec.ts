import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '@shared/infra/cache';
import { Cache } from 'cache-manager';
import { JwtValidationAdapter } from './jwt-validation.adapter';
import redis = require('../../../../../../src/utils/redis');
import RedisMock = require('../../../../../../test/utils/redis/redisMock');

describe('jwt strategy', () => {
	let adapter: JwtValidationAdapter;
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtValidationAdapter,
				{
					provide: CACHE_MANAGER,
					useValue: createMock<Cache>(),
				},
				{
					provide: CacheService,
					useValue: createMock<CacheService>(),
				},
			],
		}).compile();
		const redisClientMock = RedisMock.createClient();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		redis.setRedisClient(redisClientMock);
		adapter = module.get(JwtValidationAdapter);
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
