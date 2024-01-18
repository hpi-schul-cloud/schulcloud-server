import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { OAuthGrantType } from '@modules/oauth/interface/oauth-grant-type.enum';
import { TokenRequestMapper } from '@modules/oauth/mapper/token-request.mapper';
import { AccessTokenRequest, OauthTokenResponse } from '@modules/oauth/service/dto';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import QueryString from 'qs';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { SchulconnexPersonenInfoParams } from './request';
import { SanisResponse } from './response';
import { SchulconnexClientConfiguration } from './schulconnex-client-configuration';

@Injectable()
export class SchulconnexRestClient {
	private readonly API_BASE_URL: string;

	constructor(
		private readonly config: SchulconnexClientConfiguration,
		private readonly httpService: HttpService,
		private readonly oauthAdapterService: OauthAdapterService
	) {
		this.API_BASE_URL = config.apiUrl;
	}

	public async getPersonInfo(accessToken: string): Promise<SanisResponse> {
		const axiosConfig: AxiosRequestConfig = {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Accept-Encoding': 'gzip',
			},
		};

		const axiosResponse: AxiosResponse<SanisResponse> = await firstValueFrom(
			this.httpService.get(`${this.API_BASE_URL}/person-info`, axiosConfig)
		);

		return axiosResponse.data;
	}

	public async getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SanisResponse[]> {
		try {
			const token: OAuthTokenDto = await this.requestClientCredentialToken();

			const response: AxiosResponse<SanisResponse[]> = await lastValueFrom(
				this.httpService.get(`${this.API_BASE_URL}/personen-info`, {
					headers: { Authorization: `Bearer ${token.accessToken}`, AcceptEncoding: 'gzip' },
					params: QueryString.stringify(params),
				})
			);

			if (response.status !== HttpStatus.OK) {
				throw new Error(`HTTP request failed with status ${response.status}`);
			}

			return response.data;
		} catch (e: unknown) {
			// TODO: what we want to throw?
			throw new Error('Failed to fetch personen-info from schulconnex');
		}
	}

	private async requestClientCredentialToken(): Promise<OAuthTokenDto> {
		const { tokenEndpoint, clientId, clientSecret } = this.config;

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
}
