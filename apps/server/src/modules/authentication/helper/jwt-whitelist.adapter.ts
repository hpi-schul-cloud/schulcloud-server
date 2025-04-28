import { createRedisIdentifierFromJwtData, getRedisData, JwtRedisData } from '@imports-from-feathers';
import { KeyvValkeyAdapter } from '@infra/cache';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	public async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
		const redisData: JwtRedisData = getRedisData({});
		const expirationInMilliseconds: number = redisData.expirationInSeconds;

		await this.cacheManager.set(redisIdentifier, redisData, expirationInMilliseconds);
	}

	public async removeFromWhitelist(accountId: string, jti?: string): Promise<void> {
		let keys: string[] = [];

		if (jti) {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
			keys = [redisIdentifier];
		} else {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, '*');
			keys = await this.getStore().keys(redisIdentifier);
		}

		const deleteKeysPromise: Promise<boolean>[] = keys.map(
			(key: string): Promise<boolean> => this.cacheManager.del(key)
		);

		await Promise.all(deleteKeysPromise);
	}

	protected getStore(): KeyvValkeyAdapter {
		const store = this.cacheManager.stores.map((store): KeyvValkeyAdapter => {
			if (store.store instanceof KeyvValkeyAdapter) return store.store;
			throw new Error('Cache store not found');
		});

		return store[0];
	}
}
