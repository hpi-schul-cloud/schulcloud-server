import { InMemoryClient, StorageClient } from '@infra/valkey-client';
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

	/**
	 * When validating a jwt it must be added to a whitelist, here we check this.
	 * When the jwt is validated, the expiration time will be extended with this call.
	 * @param accountId users account id
	 * @param jti jwt id (here required to make jwt identifiers identical in redis)
	 */
	public async isWhitelisted(accountId: string, jti: string): Promise<void> {
		if (this.storageClient instanceof InMemoryClient) {
			return;
		}

		const redisIdentifier: string = createJwtRedisIdentifier(accountId, jti);
		const redisData: JwtRedisData = createJwtRedisData(this.config.jwtTimeoutSeconds);

		const value = await this.storageClient.get(redisIdentifier);

		if (value !== null) {
			await this.storageClient.set(redisIdentifier, JSON.stringify(redisData), 'EX', redisData.expirationInSeconds);
			return;
		}

		throw new UnauthorizedException('Session was expired due to inactivity - autologout.');
	}
}
