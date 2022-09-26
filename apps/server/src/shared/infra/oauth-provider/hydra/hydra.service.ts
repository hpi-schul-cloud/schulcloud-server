import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	ConsentResponse,
	IntrospectResponse,
	ProviderLoginResponse,
	OauthClient,
	RejectRequestBody,
	ProviderRedirectResponse,
} from '../dto';
import { OauthProviderService } from '../oauth-provider.service';

@Injectable()
export class HydraService extends OauthProviderService {
	private readonly hydraUri: string;

	constructor(private readonly httpService: HttpService) {
		super();
		this.hydraUri = Configuration.get('HYDRA_URI') as string;
	}

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse> {
		return this.request<ProviderRedirectResponse>(
			'PUT',
			`${this.hydraUri}/oauth2/auth/requests/login/accept?login_challenge=${challenge}`,
			body
		);
	}

	acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	createOAuth2Client(data: OauthClient): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	deleteOAuth2Client(id: string): Promise<void> {
		throw new NotImplementedException();
	}

	getConsentRequest(challenge: string): Promise<ConsentResponse> {
		throw new NotImplementedException();
	}

	getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		return this.request<ProviderLoginResponse>(
			'GET',
			`${this.hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`
		);
	}

	getOAuth2Client(id: string): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	introspectOAuth2Token(token: string, scope: string): Promise<IntrospectResponse> {
		throw new NotImplementedException();
	}

	isInstanceAlive(): Promise<boolean> {
		throw new NotImplementedException();
	}

	listConsentSessions(user: string): Promise<ConsentSessionResponse[]> {
		throw new NotImplementedException();
	}

	listOAuth2Clients(): Promise<OauthClient[]> {
		throw new NotImplementedException();
	}

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		return this.request<ProviderRedirectResponse>(
			'PUT',
			`${this.hydraUri}/oauth2/auth/requests/login/reject?login_challenge=${challenge}`,
			body
		);
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		throw new NotImplementedException();
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	protected async request<T>(
		method: Method,
		url: string,
		data?: unknown,
		additionalHeaders: AxiosRequestHeaders = {}
	): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.request({
			url,
			method,
			headers: {
				'X-Forwarded-Proto': 'https',
				...additionalHeaders,
			},
			data,
		});
		const response: AxiosResponse<T> = await firstValueFrom(observable);
		return response.data;
	}
}
