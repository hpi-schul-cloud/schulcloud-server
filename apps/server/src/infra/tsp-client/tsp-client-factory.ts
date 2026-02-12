import { AxiosErrorLoggable } from '@core/error/loggable';
import { ClientCredentialsGrantTokenRequest, OauthAdapterService, OAuthGrantType } from '@modules/oauth-adapter';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import util from 'util';
import { DefaultEncryptionService, EncryptionService } from '../encryption';
import { Configuration, ExportApiFactory, ExportApiInterface } from './generated';
import { TspAccessTokenLoggableError } from './loggable/tsp-access-token.loggable-error';
import { TSP_CLIENT_CONFIG_TOKEN, TspClientConfig } from './tsp-client.config';

type FactoryParams = {
	clientId: string;
	clientSecret: string;
	tokenEndpoint: string;
};

@Injectable()
export class TspClientFactory {
	private readonly baseUrl: string;

	private readonly tokenLifetime: number;

	private cachedToken: string | undefined;

	private tokenExpiresAt: number | undefined;

	constructor(
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(TSP_CLIENT_CONFIG_TOKEN) config: TspClientConfig,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {
		this.baseUrl = config.baseUrl;
		this.tokenLifetime = config.tokenLifetimeMs;
	}

	public createExportClient(params: FactoryParams): ExportApiInterface {
		const factory = ExportApiFactory(
			new Configuration({
				// accessToken has to be a function otherwise it will be called once
				// and will not be refresh the access token when it expires
				apiKey: () => this.getAccessToken(params),
				basePath: this.baseUrl,
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
		} catch (oauthAdapterError) {
			let error: Error;
			if (oauthAdapterError instanceof AxiosError) {
				error = new AxiosErrorLoggable(oauthAdapterError, 'TSP_OAUTH_ERROR');
			} else if (oauthAdapterError instanceof Error) {
				error = oauthAdapterError;
			} else {
				error = new Error(util.inspect(oauthAdapterError));
			}

			throw new TspAccessTokenLoggableError(error);
		}
	}

	private getExpiresAt(now: number, token: string): number {
		const decoded = jwt.decode(token, { json: true });
		const expiresAt = decoded?.exp || now + this.tokenLifetime;

		return expiresAt;
	}
}
