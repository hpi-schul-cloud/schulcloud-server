import { ServerConfig } from '@modules/server';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Configuration, ExportApiFactory, ExportApiInterface } from './generated';

@Injectable()
export class TspClientFactory {
	private readonly domain: string;

	private readonly host: string;

	private readonly baseUrl: string;

	private readonly clientId: string;

	private readonly clientSecret: string;

	private readonly signingKey: string;

	private readonly tokenLifetime: number;

	private cachedToken: string | undefined;

	private tokenExpiresAt: number | undefined;

	constructor(configService: ConfigService<ServerConfig, true>) {
		this.domain = configService.getOrThrow<string>('SC_DOMAIN');
		this.host = configService.getOrThrow<string>('HOST');
		this.baseUrl = configService.getOrThrow<string>('TSP_API_BASE_URL');
		this.clientId = configService.getOrThrow<string>('TSP_API_CLIENT_ID');
		this.clientSecret = configService.getOrThrow<string>('TSP_API_CLIENT_SECRET');
		this.signingKey = configService.getOrThrow<string>('TSP_API_SIGNATURE_KEY');
		this.tokenLifetime = configService.getOrThrow<number>('TSP_API_TOKEN_LIFETIME_MS');
	}

	public createExportClient(): ExportApiInterface {
		const factory = ExportApiFactory(
			new Configuration({
				accessToken: this.createJwt(),
				basePath: this.baseUrl,
			})
		);

		return factory;
	}

	private createJwt(): string {
		const now = Date.now();

		if (this.cachedToken && this.tokenExpiresAt && this.tokenExpiresAt > now) {
			return this.cachedToken;
		}

		this.tokenExpiresAt = now + this.tokenLifetime;

		const payload = {
			apiClientId: this.clientId,
			apiClientSecret: this.clientSecret,
			iss: this.domain,
			aud: this.baseUrl,
			sub: this.host,
			exp: this.tokenExpiresAt,
			iat: this.tokenExpiresAt - this.tokenLifetime,
			jti: randomUUID(),
		};

		this.cachedToken = jwt.sign(payload, this.signingKey);

		return this.cachedToken;
	}
}
