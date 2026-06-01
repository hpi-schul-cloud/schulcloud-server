import {
	createJwtRedisData,
	createJwtRedisIdentifier,
	InternalJwtWhitelistConfig,
	JWT_WHITELIST_CONFIG_TOKEN,
} from '@infra/auth-guard';
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
		const { jwtTimeoutSeconds } = this.config;
		const redisIdentifier = createJwtRedisIdentifier(accountId, jti);
		const redisData = createJwtRedisData(jwtTimeoutSeconds);

		await this.storageClient.set(redisIdentifier, JSON.stringify(redisData), 'EX', jwtTimeoutSeconds);
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
