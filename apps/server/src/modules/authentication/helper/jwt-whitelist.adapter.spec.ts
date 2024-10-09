import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtValidationAdapter } from '@infra/auth-guard/';
import { CacheService } from '@infra/cache';
import { CacheStoreType } from '@infra/cache/interface/cache-store-type.enum';
import { ObjectId } from '@mikro-orm/mongodb';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { feathersRedis } from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';
import { JwtWhitelistAdapter } from './jwt-whitelist.adapter';
import RedisMock = require('../../../../../../test/utils/redis/redisMock');

describe(JwtWhitelistAdapter.name, () => {
	let module: TestingModule;
	let jwtWhitelistAdapter: JwtWhitelistAdapter;
	let jwtValidationAdapter: JwtValidationAdapter;

	let cacheManager: DeepMocked<Cache>;
	let cacheService: DeepMocked<CacheService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtValidationAdapter,
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
		jwtWhitelistAdapter = module.get(JwtWhitelistAdapter);
		jwtValidationAdapter = module.get(JwtValidationAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('addToWhitelist', () => {
		describe('when authenticate a user with jwt', () => {
			it('should fail without whitelisted jwt', async () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				await expect(jwtValidationAdapter.isWhitelisted(accountId, jti)).rejects.toThrow(
					'Session was expired due to inactivity - autologout.'
				);
			});
			it('should pass when jwt has been whitelisted', async () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				await jwtWhitelistAdapter.addToWhitelist(accountId, jti);
				// might fail when we would wait more than JWT_TIMEOUT_SECONDS
				await jwtValidationAdapter.isWhitelisted(accountId, jti);
			});
		});
	});

	describe('removeFromWhitelist', () => {
		describe('when redis is used as cache store and a jti was provided', () => {
			it('should call the cache manager to delete the entry from the cache', async () => {
				cacheService.getStoreType.mockReturnValue(CacheStoreType.REDIS);

				await jwtWhitelistAdapter.removeFromWhitelist('accountId', 'jti');

				expect(cacheManager.del).toHaveBeenCalledWith('jwt:accountId:jti');
			});
		});

		describe('when redis is used as cache store and no jti was provided', () => {
			it('should call the cache manager to delete all entries from the cache', async () => {
				// TODO
				cacheService.getStoreType.mockReturnValue(CacheStoreType.REDIS);

				await jwtWhitelistAdapter.removeFromWhitelist('accountId');

				expect(cacheManager.del).toHaveBeenCalledWith('jwt:accountId:*');
			});
		});

		describe('when a memory store is used', () => {
			it('should do nothing', async () => {
				cacheService.getStoreType.mockReturnValue(CacheStoreType.MEMORY);

				await jwtWhitelistAdapter.removeFromWhitelist('accountId', 'jti');

				expect(cacheManager.del).not.toHaveBeenCalled();
			});
		});
	});
});
