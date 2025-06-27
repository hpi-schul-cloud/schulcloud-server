import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import {
	AuthenticationCodeGrantTokenRequest,
	ClientCredentialsGrantTokenRequest,
	OAuthTokenDto,
	OauthTokenResponse,
} from '../dto';
import { OAuthAdapterErrorLoggableException } from '../loggable/oauth-adapter-error.loggable-exception';
import { TokenRequestMapper } from '../mapper/token-request.mapper';

@Injectable()
export class OauthAdapterService {
	constructor(private readonly httpService: HttpService) {}

	public async getPublicKey(jwksUri: string): Promise<string> {
		const client: JwksRsa.JwksClient = JwksRsa({
			cache: true,
			jwksUri,
		});

		const key: JwksRsa.SigningKey = await client.getSigningKey();

		return key.getPublicKey();
	}

	public async sendTokenRequest(
		tokenEndpoint: string,
		payload: AuthenticationCodeGrantTokenRequest | ClientCredentialsGrantTokenRequest
	): Promise<OAuthTokenDto> {
		const urlEncodedPayload: string = QueryString.stringify(payload);

		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(tokenEndpoint, urlEncodedPayload, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		const tokenDto: OAuthTokenDto = await this.resolveTokenRequest(responseTokenObservable);

		return tokenDto;
	}

	private async resolveTokenRequest(
		observable: Observable<AxiosResponse<OauthTokenResponse, unknown>>
	): Promise<OAuthTokenDto> {
		let responseToken: AxiosResponse<OauthTokenResponse>;

		try {
			responseToken = await lastValueFrom(observable);
		} catch (error: unknown) {
			throw new OAuthAdapterErrorLoggableException('Failed to resolve token request', error as Error).getLogMessage();
		}

		const tokenDto: OAuthTokenDto = TokenRequestMapper.mapTokenResponseToDto(responseToken.data);

		return tokenDto;
	}
}
