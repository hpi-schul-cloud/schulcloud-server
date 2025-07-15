import { StorageClient } from '@infra/valkey-client';
import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ACCESS_TOKEN_VALKEY_CLIENT } from '../access-token.config';
import { AccessTokenFactory } from './factory';
import { ResolveTokenParams } from './types';
import { AccessToken } from './vo';

@Injectable()
export class AccessTokenService {
	constructor(@Inject(ACCESS_TOKEN_VALKEY_CLIENT) private readonly storageClient: StorageClient) {}

	public async createToken<T>(payload: T, tokenTtl: number): Promise<AccessToken> {
		const token = AccessTokenFactory.build();
		const value = JSON.stringify(payload);

		await this.persistTokenData(token.token, value, tokenTtl);

		return token;
	}

	public async resolveToken<T>(params: ResolveTokenParams, build: (data: T) => T): Promise<T> {
		const { token, tokenTtl } = params;
		const value = await this.storageClient.get(token);

		if (!value) {
			throw new ForbiddenException(`Token ${token} not found`);
		}

		await this.renewTokenTimeout(token, value, tokenTtl);

		try {
			const payload = JSON.parse(value) as T;
			const validatedPayload = build(payload);

			return validatedPayload;
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
