import { Logger } from '@core/logger';
import {
	ClientCredentialsGrantTokenRequest,
	OauthAdapterService,
	OAuthGrantType,
	OAuthTokenDto,
} from '@modules/oauth-adapter';
import { HttpService } from '@nestjs/axios';
import { Inject } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { SchulconnexConfigurationMissingLoggable } from './loggable';
import { SchulconnexPersonenInfoParams } from './request';
import {
	SchulconnexPoliciesInfoErrorResponse,
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
} from './response';
import { SchulconnexApiInterface } from './schulconnex-api.interface';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from './schulconnex-client.config';

export class SchulconnexRestClient implements SchulconnexApiInterface {
	private readonly SCHULCONNEX_API_BASE_URL: string;

	constructor(
		@Inject(SCHULCONNEX_CLIENT_CONFIG_TOKEN) private readonly config: SchulconnexClientConfig,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		private readonly logger: Logger
	) {
		this.checkOptions();
		this.SCHULCONNEX_API_BASE_URL = config.apiUrl || '';
	}

	public getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexResponse> {
		const url: URL = new URL(options?.overrideUrl ?? `${this.SCHULCONNEX_API_BASE_URL}/person-info`);

		const response: Promise<SchulconnexResponse> = this.getRequest<SchulconnexResponse>(
			url,
			accessToken,
			this.config.personInfoTimeoutInMs
		);

		return response;
	}

	public async getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SchulconnexResponse[]> {
		const token: OAuthTokenDto = await this.requestClientCredentialToken();

		const url: URL = new URL(`${this.SCHULCONNEX_API_BASE_URL}/personen-info`);
		url.search = QueryString.stringify(params, { arrayFormat: 'comma' });

		const response: Promise<SchulconnexResponse[]> = this.getRequest<SchulconnexResponse[]>(
			url,
			token.accessToken,
			this.config.personenInfoTimeoutInMs
		);

		return response;
	}

	public async getPoliciesInfo(
		accessToken: string,
		options?: { overrideUrl: string }
	): Promise<SchulconnexPoliciesInfoResponse> {
		const url: URL = new URL(options?.overrideUrl ?? `${this.SCHULCONNEX_API_BASE_URL}/policies-info`);

		const response: (SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse)[] =
			await this.getRequest<(SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse)[]>(
				url,
				accessToken,
				this.config.policiesInfoTimeoutInMs
			);

		const responseObject: SchulconnexPoliciesInfoResponse = { data: response };

		return responseObject;
	}

	private checkOptions(): boolean {
		if (!this.config.apiUrl || !this.config.clientId || !this.config.clientSecret || !this.config.tokenEndpoint) {
			this.logger.debug(new SchulconnexConfigurationMissingLoggable());
			return false;
		}
		return true;
	}

	private async getRequest<T>(url: URL, accessToken: string, timeout?: number): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Accept-Encoding': 'gzip',
			},
			timeout,
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}

	private async requestClientCredentialToken(): Promise<OAuthTokenDto> {
		const { tokenEndpoint, clientId, clientSecret } = this.config;

		if (!this.checkOptions()) {
			return Promise.reject(new Error('Missing configuration for SchulconnexRestClient'));
		}

		const payload: ClientCredentialsGrantTokenRequest = new ClientCredentialsGrantTokenRequest({
			client_id: clientId ?? '',
			client_secret: clientSecret ?? '',
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const tokenDto: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(tokenEndpoint ?? '', payload);

		return tokenDto;
	}
}
