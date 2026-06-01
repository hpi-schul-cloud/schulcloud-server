import { StorageClient } from '@infra/valkey-client';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_GUARD_VALKEY_CLIENT, JWT_WHITELIST_CONFIG_TOKEN } from '../auth-guard.constants';
import { createJwtRedisData, createJwtRedisIdentifier, JwtRedisData } from '../helper';
import { InternalJwtWhitelistConfig } from '../interface';

@Injectable()
export class JwtValidationAdapter {
	constructor(
		@Inject(AUTH_GUARD_VALKEY_CLIENT) private readonly storageClient: StorageClient,
		@Inject(JWT_WHITELIST_CONFIG_TOKEN) private readonly config: InternalJwtWhitelistConfig
	) {}

	public async isWhitelisted(accountId: string, jti: string): Promise<void> {
		if (this.storageClient.isInMemory) return;

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
