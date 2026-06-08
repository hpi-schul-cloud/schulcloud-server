import { StorageClient } from '@infra/valkey-client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { createJwtRedisData, JwtRedisData } from '../helper';
import { InternalJwtWhitelistConfig } from '../interface';
import { JwtWhitelistIdentifier } from './jwt-whitelist-identifier.vo';

@Injectable()
export class JwtWhitelistAdapter {
	constructor(
		private readonly storageClient: StorageClient,
		private readonly config: InternalJwtWhitelistConfig
	) {}

	public async addToWhitelist(accountId: EntityId, jti: string): Promise<void> {
		const redisIdentifier = JwtWhitelistIdentifier.forJti(accountId, jti);
		const redisData = createJwtRedisData(this.config.jwtTimeoutSeconds);

		await this.setInStorage(redisIdentifier, redisData);
	}

	public async removeFromWhitelist(accountId: EntityId, jti?: string): Promise<void> {
		let keys: string[] = [];

		if (jti) {
			keys = this.getKeyByJti(accountId, jti);
		} else {
			keys = await this.getKeysByAccount(accountId);
		}

		await this.deleteKeys(keys);
	}

	public async isWhitelisted(accountId: EntityId, jti: string): Promise<void> {
		if (this.storageClient.constructor.name === 'InMemoryClient') return;

		const redisIdentifier = JwtWhitelistIdentifier.forJti(accountId, jti);
		const redisData = createJwtRedisData(this.config.jwtTimeoutSeconds);
		const value = await this.storageClient.get(redisIdentifier.toString());

		this.checkValue(value);

		await this.setInStorage(redisIdentifier, redisData);
	}

	private getKeyByJti(accountId: EntityId, jti: string): string[] {
		const redisIdentifier = JwtWhitelistIdentifier.forJti(accountId, jti);
		const keys = [redisIdentifier.toString()];

		return keys;
	}

	private async getKeysByAccount(accountId: EntityId): Promise<string[]> {
		const redisIdentifier = JwtWhitelistIdentifier.forAccount(accountId);
		const keys = await this.storageClient.keys(redisIdentifier.toString());

		return keys;
	}

	private async deleteKeys(keys: string[]): Promise<void> {
		const deleteKeysPromise = keys.map(async (key: string) => {
			await this.storageClient.del(key);
		});

		await Promise.all(deleteKeysPromise);
	}

	private async setInStorage(redisIdentifier: JwtWhitelistIdentifier, redisData: JwtRedisData): Promise<void> {
		await this.storageClient.set(
			redisIdentifier.toString(),
			JSON.stringify(redisData),
			'EX',
			this.config.jwtTimeoutSeconds
		);
	}

	private checkValue(value: string | null): void {
		if (value === null) {
			throw new UnauthorizedException('Session was expired due to inactivity - autologout.');
		}
	}
}
