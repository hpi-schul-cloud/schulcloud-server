import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@infra/cache';
import { CacheStoreType } from '@infra/cache/interface/cache-store-type.enum';
import {
	addTokenToWhitelist,
	createRedisIdentifierFromJwtData,
	ensureTokenIsWhitelisted,
} from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtValidationAdapter {
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly cacheService: CacheService
	) {}

	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	async isWhitelisted(accountId: string, jti: string): Promise<void> {
		await ensureTokenIsWhitelisted({ accountId, jti, privateDevice: false });
	}

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
