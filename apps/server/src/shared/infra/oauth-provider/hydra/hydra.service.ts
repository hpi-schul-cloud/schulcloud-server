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
	LoginResponse,
	OauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
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
		return this.put<ProviderRedirectResponse>('consent', 'accept', challenge, body);
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	async acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse> {
		const url = `${this.hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=${challenge}`;
		const response: Promise<ProviderRedirectResponse> = this.request<ProviderRedirectResponse>('PUT', url);
		return response;
	}

	createOAuth2Client(data: OauthClient): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	deleteOAuth2Client(id: string): Promise<void> {
		throw new NotImplementedException();
	}

	getConsentRequest(challenge: string): Promise<ConsentResponse> {
		return this.get<ConsentResponse>('consent', challenge);
	}

	getLoginRequest(challenge: string): Promise<LoginResponse> {
		throw new NotImplementedException();
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
		return this.put<ProviderRedirectResponse>('consent', 'reject', challenge, body);
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		throw new NotImplementedException();
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	protected async put<T>(
		flow: string,
		action: string,
		challenge: string,
		body: AcceptConsentRequestBody | AcceptLoginRequestBody | RejectRequestBody
	): Promise<T> {
		return this.request<T>(
			'PUT',
			`${this.hydraUri}/oauth2/auth/requests/${flow}/${action}?${flow}_challenge=${challenge}`,
			body
		);
	}

	protected async get<T>(flow: string, challenge: string): Promise<T> {
		return this.request<T>('GET', `${this.hydraUri}/oauth2/auth/requests/${flow}?${flow}_challenge=${challenge}`);
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
