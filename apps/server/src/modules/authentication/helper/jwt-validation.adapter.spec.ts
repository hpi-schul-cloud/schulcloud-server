import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CacheService } from '@infra/cache';
import { CacheStoreType } from '@infra/cache/interface/cache-store-type.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { feathersRedis } from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';
import { JwtWhitelistAdapter } from './jwt-whitelist.adapter';
import RedisMock = require('../../../../../../test/utils/redis/redisMock');

describe('jwt strategy', () => {
	let module: TestingModule;
	let adapter: JwtWhitelistAdapter;

	let cacheManager: DeepMocked<Cache>;
	let cacheService: DeepMocked<CacheService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtWhitelistAdapter,
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
		const redisClientMock = new RedisMock();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		feathersRedis.setRedisClient(redisClientMock);

		cacheManager = module.get(CACHE_MANAGER);
		cacheService = module.get(CacheService);
		adapter = module.get(JwtWhitelistAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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
