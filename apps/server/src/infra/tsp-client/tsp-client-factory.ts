import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosErrorLoggable, ErrorLoggable } from '@src/core/error/loggable';
import { Logger } from '@src/core/logger';
import { OauthAdapterService } from '@src/modules/oauth';
import { OAuthGrantType } from '@src/modules/oauth/interface/oauth-grant-type.enum';
import { ClientCredentialsGrantTokenRequest } from '@src/modules/oauth/service/dto';
import { AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import { DefaultEncryptionService, EncryptionService } from '../encryption';
import { Configuration, ExportApiFactory, ExportApiInterface } from './generated';
import { TspClientConfig } from './tsp-client-config';
import { DomainErrorHandler } from '@src/core';

type FactoryParams = {
	clientId: string;
	clientSecret: string;
	tokenEndpoint: string;
};

@Injectable()
export class TspClientFactory {
	private readonly tokenLifetime: number;

	private cachedToken: string | undefined;

	private tokenExpiresAt: number | undefined;

	constructor(
		private readonly oauthAdapterService: OauthAdapterService,
		configService: ConfigService<TspClientConfig, true>,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService,
		private readonly logger: Logger
	) {
		this.tokenLifetime = configService.getOrThrow<number>('TSP_API_CLIENT_TOKEN_LIFETIME_MS');
	}

	// Bitte infer nutzen anstatt <string>
	// und nicht im constructor zuweisen, damit sich die verschiedenen Zustände der Config leicht testen lassen.
	// siehe deletion.cient.ts
	private getBaseUrl(): string {
		const baseUrl = this.configService.getOrThrow('TSP_API_CLIENT_BASE_URL', { infer: true });

		return baseUrl;
	}

	public createExportClient(params: FactoryParams): ExportApiInterface {
		const factory = ExportApiFactory(
			new Configuration({
				// accessToken has to be a function otherwise it will be called once
				// and will not be refresh the access token when it expires
				apiKey: async () => this.getAccessToken(params),
				basePath: this.getBaseUrl(),
			})
		);

		return factory;
	}

	public async getAccessToken(params: FactoryParams): Promise<string> {
		const now = Date.now();

		if (this.cachedToken && this.tokenExpiresAt && this.tokenExpiresAt > now) {
			return this.cachedToken;
		}

		const clientSecret = this.encryptionService.decrypt(params.clientSecret);
		const payload = new ClientCredentialsGrantTokenRequest({
			client_id: params.clientId,
			client_secret: clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		try {
			const response = await this.oauthAdapterService.sendTokenRequest(params.tokenEndpoint, payload);

			this.cachedToken = response.accessToken;
			this.tokenExpiresAt = this.getExpiresAt(now, response.accessToken);

			// We need the Bearer prefix for the generated client, because OAS 2 does not support Bearer token type
			return `Bearer ${this.cachedToken}`;
		} catch (e) {
			if (e instanceof AxiosError) {
				// Vielleicht das nutzen
				this.domainErrorHandler.exec(e);
				this.logger.warning(new AxiosErrorLoggable(e, 'TSP_OAUTH_ERROR'));
			} else {
				this.logger.warning(new ErrorLoggable(e));
			}

			// Promise.reject(new TspLoggableError(e));
			// Das loggable sorgt dafür das nichts geloggt wird, was nicht geloggt werden darf.
			return Promise.reject();
		}
	}

	private getExpiresAt(now: number, token: string): number {
		const decoded = jwt.decode(token, { json: true });
		const expiresAt = decoded?.exp || now + this.tokenLifetime;

		return expiresAt;
	}
}
