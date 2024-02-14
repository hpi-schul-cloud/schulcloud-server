import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { ClientCredentialsGrantTokenRequest } from '@modules/oauth/service/dto';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { SchulconnexConfigurationMissingLoggable } from './loggable';
import { SchulconnexPersonenInfoParams } from './request';
import { SanisResponse } from './response';
import { SchulconnexApiInterface } from './schulconnex-api.interface';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

export class SchulconnexRestClient implements SchulconnexApiInterface {
	private readonly SCHULCONNEX_API_BASE_URL: string;

	constructor(
		private readonly options: SchulconnexRestClientOptions,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService,
		private readonly logger: Logger
	) {
		this.checkOptions();
		this.SCHULCONNEX_API_BASE_URL = options.apiUrl;
	}

	// TODO: N21-1678 use this in provisioning module
	public async getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SanisResponse> {
		const url: URL = new URL(options?.overrideUrl ?? `${this.SCHULCONNEX_API_BASE_URL}/person-info`);

		const response: Promise<SanisResponse> = this.getRequest<SanisResponse>(url, accessToken);

		return response;
	}

	public async getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SanisResponse[]> {
		const token: OAuthTokenDto = await this.requestClientCredentialToken();

		const url: URL = new URL(`${this.SCHULCONNEX_API_BASE_URL}/personen-info`);
		url.search = QueryString.stringify(params, { arrayFormat: 'comma' });

		const response: Promise<SanisResponse[]> = this.getRequest<SanisResponse[]>(url, token.accessToken);

		return response;
	}

	private checkOptions(): void {
		if (!this.options.apiUrl || !this.options.clientId || !this.options.clientSecret || !this.options.tokenEndpoint) {
			this.logger.debug(new SchulconnexConfigurationMissingLoggable());
		}
	}

	private async getRequest<T>(url: URL, accessToken: string): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Accept-Encoding': 'gzip',
			},
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}

	private async requestClientCredentialToken(): Promise<OAuthTokenDto> {
		const { tokenEndpoint, clientId, clientSecret } = this.options;

		const payload: ClientCredentialsGrantTokenRequest = new ClientCredentialsGrantTokenRequest({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const tokenDto: OAuthTokenDto = await this.oauthAdapterService.sendTokenRequest(tokenEndpoint, payload);

		return tokenDto;
	}
}
