import { StorageClient } from '@infra/valkey-client';
import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ACCESS_TOKEN_VALKEY_CLIENT } from '../access-token.config';
import { AccessTokenFactory } from './factory';
import { ResolveTokenParams } from './types';
import { AccessToken } from './vo';

@Injectable()
export class AccessTokenService {
	constructor(@Inject(ACCESS_TOKEN_VALKEY_CLIENT) private readonly storageClient: StorageClient) {}

	public async createToken<T>(payload: T, tokenTtlInSeconds: number): Promise<AccessToken> {
		const token = AccessTokenFactory.build();
		const value = JSON.stringify(payload);

		await this.persistTokenData(token.token, value, tokenTtlInSeconds);

		return token;
	}

	public async resolveToken<T>(params: ResolveTokenParams, build: (data: T) => T): Promise<T> {
		const { token, tokenTtlInSeconds } = params;

		const valueResponse = await this.storageClient.get(token);
		const value = this.checkTokenExists(valueResponse);

		await this.renewTokenTimeout(token, value, tokenTtlInSeconds);

		const payload = this.parsePayload(value, token);
		const validatedPayload = build(payload as T);

		return validatedPayload;
	}

	private checkTokenExists(value: string | null): string {
		if (!value) {
			throw new ForbiddenException();
		}

		return value;
	}

	private parsePayload(value: string, token: string): unknown {
		try {
			return JSON.parse(value);
		} catch (error) {
			throw new InternalServerErrorException(`Failed to parse token payload for token ${token}`, { cause: error });
		}
	}

	private async persistTokenData(token: string, value: string, tokenTtlInSeconds: number): Promise<void> {
		await this.storageClient.set(token, value, 'EX', tokenTtlInSeconds);
	}

	private async renewTokenTimeout(token: string, value: string, tokenTtlInSeconds: number): Promise<void> {
		await this.persistTokenData(token, value, tokenTtlInSeconds);
	}
}
