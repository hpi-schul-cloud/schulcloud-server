import { CacheService } from '@infra/cache';
import { CacheStoreType } from '@infra/cache/interface/cache-store-type.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { addTokenToWhitelist, createRedisIdentifierFromJwtData } from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly cacheService: CacheService
	) {}

	async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await addTokenToWhitelist(redisIdentifier);
	}

	async removeFromWhitelist(accountId: string, jti: string): Promise<void> {
		if (this.cacheService.getStoreType() === CacheStoreType.REDIS) {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
			await this.cacheManager.del(redisIdentifier);
		}
	}
}
