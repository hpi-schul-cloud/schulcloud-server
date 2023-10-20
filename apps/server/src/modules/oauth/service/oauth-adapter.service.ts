import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common/decorators';
import { LegacyLogger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';

@Injectable()
export class OauthAdapterService {
	constructor(private readonly httpService: HttpService, private readonly logger: LegacyLogger) {
		this.logger.setContext(OauthAdapterService.name);
	}

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
		let responseToken: AxiosResponse<OauthTokenResponse>;
		try {
			responseToken = await lastValueFrom(observable);
		} catch (error) {
			throw new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step');
		}

		return responseToken.data;
	}
}
