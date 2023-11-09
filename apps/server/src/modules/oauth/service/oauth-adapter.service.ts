import { HydraOauthLoggableException } from '@infra/oauth-provider/loggable';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common/decorators';
import { isAxiosError } from '@shared/common';
import { AxiosError, AxiosResponse } from 'axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { OAuthSSOError } from '../loggable';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';

@Injectable()
export class OauthAdapterService {
	constructor(private readonly httpService: HttpService) {}

	async getPublicKey(jwksUri: string): Promise<string> {
		const client: JwksRsa.JwksClient = JwksRsa({
			cache: true,
			jwksUri,
		});
		const key: JwksRsa.SigningKey = await client.getSigningKey();
		return key.getPublicKey();
	}

	public sendAuthenticationCodeTokenRequest(
		tokenEndpoint: string,
		payload: AuthenticationCodeGrantTokenRequest
	): Promise<OauthTokenResponse> {
		const urlEncodedPayload: string = QueryString.stringify(payload);
		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(tokenEndpoint, urlEncodedPayload, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		const responseData: Promise<OauthTokenResponse> = this.resolveTokenRequest(responseTokenObservable);
		return responseData;
	}

	private async resolveTokenRequest(
		observable: Observable<AxiosResponse<OauthTokenResponse, unknown>>
	): Promise<OauthTokenResponse> {
		let responseToken: AxiosResponse<OauthTokenResponse> | undefined;
		try {
			responseToken = await lastValueFrom(observable);
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				const response = error.response as AxiosResponse;

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const errorMessage: string = (response?.data?.error?.message as string) ?? 'Requesting token failed.';
				throw new OAuthSSOError(errorMessage, 'sso_auth_code_step');
			}
		}

		if (!responseToken) {
			throw new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step');
		}

		return responseToken.data;
	}
}
