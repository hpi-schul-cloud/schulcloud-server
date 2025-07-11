import { StorageClient } from '@infra/valkey-client';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ACCESS_TOKEN_VALKEY_CLIENT, AccessTokenConfig } from '../access-token.config';
import { AccessToken } from './access-token.vo';
import { AccessTokenBuilder } from './builder';

@Injectable()
export class AccessTokenService {
	private TOKEN_TTL_IN_SECONDS: number;

	constructor(
		@Inject(ACCESS_TOKEN_VALKEY_CLIENT) private readonly storageClient: StorageClient,
		configService: ConfigService<AccessTokenConfig>
	) {
		this.TOKEN_TTL_IN_SECONDS = configService.getOrThrow('JWT_TIMEOUT_SECONDS', { infer: true });
	}

	public async createToken<T>(payload: T): Promise<AccessToken> {
		const token = AccessTokenBuilder.build();
		const value = JSON.stringify(payload);

		await this.persistTokenData(token.token, value);

		return token;
	}

	public async resolveToken(params: AccessToken): Promise<unknown> {
		const { token } = params;
		const value = await this.storageClient.get(token);

		if (!value) {
			throw new ForbiddenException(`Token ${token} not found`);
		}

		await this.renewTokenTimeout(token, value);

		try {
			const payload = JSON.parse(value) as unknown;

			return payload;
		} catch (error) {
			throw new Error(`Invalid payload for token ${token}`);
		}
	}

	public async deleteToken(token: AccessToken): Promise<void> {
		await this.storageClient.del(token.token);
	}

	private async persistTokenData(token: string, value: string): Promise<void> {
		await this.storageClient.set(token, value, 'EX', this.TOKEN_TTL_IN_SECONDS);
	}

	private async renewTokenTimeout(token: string, value: string): Promise<void> {
		await this.persistTokenData(token, value);
	}
}
