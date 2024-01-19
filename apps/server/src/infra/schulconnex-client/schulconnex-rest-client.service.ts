import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { TokenRequestMapper } from '@modules/oauth/mapper/token-request.mapper';
import { AccessTokenRequest, OauthTokenResponse } from '@modules/oauth/service/dto';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { lastValueFrom, Observable } from 'rxjs';
import { SchulconnexPersonenInfoParams } from './request';
import { SanisResponse } from './response';
import { SchulconnexApiInterface } from './schulconnex-api.interface';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

// TODO: test me
@Injectable()
export class SchulconnexRestClient implements SchulconnexApiInterface {
	public readonly API_BASE_URL: string;

	constructor(
		private readonly options: SchulconnexRestClientOptions,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService
	) {
		this.API_BASE_URL = options.apiUrl;
	}

	// TODO: N21-1678 use this in provisioning module
	public async getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SanisResponse> {
		const request: Observable<AxiosResponse<SanisResponse>> = this.httpService.get(
			options?.overrideUrl ?? `${this.API_BASE_URL}/person-info`,
			this.createAxiosConfig(accessToken)
		);

		const response: Promise<SanisResponse> = this.resolveRequest<SanisResponse>(request);

		return response;
	}

	public async getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SanisResponse[]> {
		const token: OAuthTokenDto = await this.requestClientCredentialToken();

		const request: Observable<AxiosResponse<SanisResponse[]>> = this.httpService.get(
			`${this.API_BASE_URL}/personen-info`,
			{
				...this.createAxiosConfig(token.accessToken),
				params,
			}
		);

		const response: Promise<SanisResponse[]> = this.resolveRequest<SanisResponse[]>(request);

		return response;
	}

	private createAxiosConfig(accessToken: string): AxiosRequestConfig {
		const axiosConfig: AxiosRequestConfig = {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Accept-Encoding': 'gzip',
			},
		};

		return axiosConfig;
	}

	private async requestClientCredentialToken(): Promise<OAuthTokenDto> {
		const { tokenEndpoint, clientId, clientSecret } = this.options;

		const payload: AccessTokenRequest = new AccessTokenRequest({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
		});

		const responseToken: OauthTokenResponse = await this.oauthAdapterService.sendAuthenticationCodeTokenRequest(
			tokenEndpoint,
			payload
		);

		const tokenDto: OAuthTokenDto = TokenRequestMapper.mapTokenResponseToDto(responseToken);
		return tokenDto;
	}

	private async resolveRequest<T>(observable: Observable<AxiosResponse<T>>): Promise<T> {
		let responseToken: AxiosResponse<T>;
		try {
			responseToken = await lastValueFrom(observable);
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				// TODO should we throw something else here?
				throw error;
			}
			throw error;
		}

		return responseToken.data;
	}
}
