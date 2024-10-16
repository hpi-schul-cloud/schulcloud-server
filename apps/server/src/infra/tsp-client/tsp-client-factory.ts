import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthAdapterService } from '@src/modules/oauth';
import { OAuthGrantType } from '@src/modules/oauth/interface/oauth-grant-type.enum';
import { ClientCredentialsGrantTokenRequest } from '@src/modules/oauth/service/dto';
import * as jwt from 'jsonwebtoken';
import { Configuration, ExportApiFactory, ExportApiInterface } from './generated';
import { TspClientConfig } from './tsp-client-config';

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
		configService: ConfigService<TspClientConfig, true>
	) {
		this.baseUrl = configService.getOrThrow<string>('TSP_API_BASE_URL');
		this.tokenLifetime = configService.getOrThrow<number>('TSP_API_TOKEN_LIFETIME_MS');
	}

	public createExportClient(params: FactoryParams): ExportApiInterface {
		const factory = ExportApiFactory(
			new Configuration({
				// accessToken has to be a function otherwise it will be called once
				// and will not be refresh the access token when it expires
				apiKey: async () => this.getAccessToken(params),
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

		const payload = new ClientCredentialsGrantTokenRequest({
			client_id: params.clientId,
			client_secret: params.clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const response = await this.oauthAdapterService.sendTokenRequest(params.tokenEndpoint, payload);

		this.cachedToken = response.accessToken;
		this.tokenExpiresAt = this.getExpiresAt(now, response.accessToken);

		// We need the Bearer prefix for the generated client, because OAS 2 does not support Bearer token type
		return `Bearer ${this.cachedToken}`;
	}

	private getExpiresAt(now: number, token: string): number {
		const decoded = jwt.decode(token, { json: true });
		const expiresAt = decoded?.exp || now + this.tokenLifetime;

		return expiresAt;
	}
}
