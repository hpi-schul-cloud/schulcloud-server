import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '@shared/infra/cache';
import { CacheStoreType } from '@shared/infra/cache/interface/cache-store-type.enum';
import { feathersRedis } from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';
import { JwtValidationAdapter } from './jwt-validation.adapter';
import RedisMock = require('../../../../../../test/utils/redis/redisMock');

describe('jwt strategy', () => {
	let module: TestingModule;
	let adapter: JwtValidationAdapter;

	let cacheManager: DeepMocked<Cache>;
	let cacheService: DeepMocked<CacheService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		const redisClientMock = RedisMock.createClient();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		feathersRedis.setRedisClient(redisClientMock);

		cacheManager = module.get(CACHE_MANAGER);
		cacheService = module.get(CacheService);
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

	describe('removeFromWhitelist is called', () => {
		describe('when redis is used as cache store', () => {
			it('should call the cache manager to delete the entry from the cache', async () => {
				cacheService.getStoreType.mockReturnValue(CacheStoreType.REDIS);

				await adapter.removeFromWhitelist('accountId', 'jti');

				expect(cacheManager.del).toHaveBeenCalledWith('jwt:accountId:jti');
			});
		});

		describe('when a memory store is used', () => {
			it('should do nothing', async () => {
				cacheService.getStoreType.mockReturnValue(CacheStoreType.MEMORY);

				await adapter.removeFromWhitelist('accountId', 'jti');

				expect(cacheManager.del).not.toHaveBeenCalled();
			});
		});
	});
});
