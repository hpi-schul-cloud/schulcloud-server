import { createJwtRedisData, createJwtRedisIdentifier, JWT_WHITELIST_CONFIG_TOKEN } from '@infra/auth-guard';
import { InternalJwtWhitelistConfig } from '@infra/auth-guard/interface';
import { StorageClient } from '@infra/valkey-client';
import { Inject, Injectable } from '@nestjs/common';
import { SESSION_VALKEY_CLIENT } from '../authentication-config';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(
		@Inject(SESSION_VALKEY_CLIENT) private readonly storageClient: StorageClient,
		@Inject(JWT_WHITELIST_CONFIG_TOKEN) private readonly config: InternalJwtWhitelistConfig
	) {}

	public async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier = createJwtRedisIdentifier(accountId, jti);
		const redisData = createJwtRedisData(this.config.jwtTimeoutSeconds);

		await this.storageClient.set(redisIdentifier, JSON.stringify(redisData), 'EX', redisData.expirationInSeconds);
	}

	public async removeFromWhitelist(accountId: string, jti?: string): Promise<void> {
		let keys: string[] = [];

		if (jti) {
			const redisIdentifier = createJwtRedisIdentifier(accountId, jti);
			keys = [redisIdentifier];
		} else {
			const redisIdentifier = createJwtRedisIdentifier(accountId, '*');
			keys = await this.storageClient.keys(redisIdentifier);
		}

		const deleteKeysPromise: Promise<void>[] = keys.map(async (key: string): Promise<void> => {
			await this.storageClient.del(key);
		});

		await Promise.all(deleteKeysPromise);
	}
}
