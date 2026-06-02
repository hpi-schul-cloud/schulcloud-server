import { StorageClient } from '@infra/valkey-client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createJwtRedisData, createJwtRedisIdentifier, JwtRedisData } from '../helper';
import { InternalJwtWhitelistConfig } from '../interface';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(
		private readonly storageClient: StorageClient,
		private readonly config: InternalJwtWhitelistConfig
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

	public async isWhitelisted(accountId: string, jti: string): Promise<void> {
		if (this.storageClient.constructor.name === 'InMemoryClient') return;

		const redisIdentifier = createJwtRedisIdentifier(accountId, jti);
		const redisData = createJwtRedisData(this.config.jwtTimeoutSeconds);
		const value = await this.storageClient.get(redisIdentifier);

		this.checkValue(value);

		await this.extendExpiration(redisIdentifier, redisData);
	}

	private async extendExpiration(redisIdentifier: string, redisData: JwtRedisData): Promise<void> {
		await this.storageClient.set(redisIdentifier, JSON.stringify(redisData), 'EX', redisData.expirationInSeconds);
	}

	private checkValue(value: string | null): void {
		if (value === null) {
			throw new UnauthorizedException('Session was expired due to inactivity - autologout.');
		}
	}
}
