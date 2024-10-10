import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { createRedisIdentifierFromJwtData, getRedisData, JwtRedisData } from '@src/imports-from-feathers';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
		const redisData: JwtRedisData = getRedisData({});
		const expirationInMilliseconds: number = redisData.expirationInSeconds * 1000;

		await this.cacheManager.set(redisIdentifier, redisData, expirationInMilliseconds);
	}

	async removeFromWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);

		await this.cacheManager.del(redisIdentifier);
	}
}
