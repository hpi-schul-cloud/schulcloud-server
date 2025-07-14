import { StorageClient } from '@infra/valkey-client';
import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ACCESS_TOKEN_VALKEY_CLIENT } from '../access-token.config';
import { AccessToken } from './access-token.vo';
import { AccessTokenBuilder } from './builder';
import { ResolveTokenParams } from './types';

@Injectable()
export class AccessTokenService {
	constructor(@Inject(ACCESS_TOKEN_VALKEY_CLIENT) private readonly storageClient: StorageClient) {}

	public async createToken<T>(payload: T, tokenTtl: number): Promise<AccessToken> {
		const token = AccessTokenBuilder.build();
		const value = JSON.stringify(payload);

		await this.persistTokenData(token.token, value, tokenTtl);

		return token;
	}

	public async resolveToken(params: ResolveTokenParams): Promise<unknown> {
		const { token, tokenTtl } = params;
		const value = await this.storageClient.get(token);

		if (!value) {
			throw new ForbiddenException(`Token ${token} not found`);
		}

		await this.renewTokenTimeout(token, value, tokenTtl);

		try {
			const payload = JSON.parse(value) as unknown;

			return payload;
		} catch (error) {
			throw new InternalServerErrorException(`Invalid payload for token ${token}`, { cause: error });
		}
	}

	private async persistTokenData(token: string, value: string, tokenTtl: number): Promise<void> {
		await this.storageClient.set(token, value, 'EX', tokenTtl);
	}

	private async renewTokenTimeout(token: string, value: string, tokenTtl: number): Promise<void> {
		await this.persistTokenData(token, value, tokenTtl);
	}
}
