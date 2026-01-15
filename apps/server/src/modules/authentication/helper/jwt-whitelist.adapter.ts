import { createRedisIdentifierFromJwtData, getRedisData, JwtRedisData } from '@imports-from-feathers';
import { StorageClient } from '@infra/valkey-client';
import { Inject, Injectable } from '@nestjs/common';
import { SESSION_VALKEY_CLIENT } from '../valkey-client-session.config';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(@Inject(SESSION_VALKEY_CLIENT) private readonly storageClient: StorageClient) {}

	public async addToWhitelist(accountId: string, jti: string): Promise<void> {
		const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
		const redisData: JwtRedisData = getRedisData({});
		const { expirationInSeconds } = redisData;

		await this.storageClient.set(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
	}

	public async removeFromWhitelist(accountId: string, jti?: string): Promise<void> {
		let keys: string[] = [];

		if (jti) {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, jti);
			keys = [redisIdentifier];
		} else {
			const redisIdentifier: string = createRedisIdentifierFromJwtData(accountId, '*');
			keys = await this.storageClient.keys(redisIdentifier);
		}

		const deleteKeysPromise: Promise<void>[] = keys.map(async (key: string): Promise<void> => {
			await this.storageClient.del(key);
		});

		await Promise.all(deleteKeysPromise);
	}
}
