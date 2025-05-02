import { createRedisIdentifierFromJwtData, getRedisData, JwtRedisData } from '@imports-from-feathers';
import { StorageClient, VALKEY_CLIENT } from '@infra/valkey-client';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(@Inject(VALKEY_CLIENT) private readonly storageClient: StorageClient) {}

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

		const deleteKeysPromise: Promise<number>[] = keys.map(
			(key: string): Promise<number> => this.storageClient.del(key)
		);

		await Promise.all(deleteKeysPromise);
	}
}
