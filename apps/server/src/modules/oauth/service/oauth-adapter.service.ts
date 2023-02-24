import { Injectable } from '@nestjs/common/decorators';
import { Logger } from '@src/core/logger';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import QueryString from 'qs';
import { Observable, lastValueFrom } from 'rxjs';
import JwksRsa from 'jwks-rsa';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto';
import { OauthConfig } from '@shared/domain';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';

@Injectable()
export class OauthAdapterService {
	constructor(private readonly httpService: HttpService, private readonly logger: Logger) {
		this.logger.setContext(OauthAdapterService.name);
	}

	async getPublicKey(oauthConfig: OauthConfig): Promise<string> {
		const client: JwksRsa.JwksClient = JwksRsa({
			cache: true,
			jwksUri: oauthConfig.jwksEndpoint,
		});
		const key: JwksRsa.SigningKey = await client.getSigningKey();
		return key.getPublicKey();
	}

	public sendTokenRequest(payload: TokenRequestPayload): Promise<OauthTokenResponse> {
		const query = QueryString.stringify(payload);
		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(`${payload.tokenEndpoint}`, query, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		return this.resolveTokenRequest(responseTokenObservable);
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
