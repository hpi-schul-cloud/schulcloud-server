import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common/decorators';
import { AxiosResponse, isAxiosError } from 'axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { TokenRequestLoggableException } from '../loggable';
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
		let responseToken: AxiosResponse<OauthTokenResponse>;
		try {
			responseToken = await lastValueFrom(observable);
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new TokenRequestLoggableException(error);
			}
			throw error;
		}

		return responseToken.data;
	}
}
