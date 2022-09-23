import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import QueryString from 'qs';
import { URL } from 'url';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	ConsentResponse,
	IntrospectResponse,
	LoginResponse,
	OauthClient,
	RedirectResponse,
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

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	async acceptLogoutRequest(challenge: string): Promise<RedirectResponse> {
		const url = `${this.hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=${challenge}`;
		const response: Promise<RedirectResponse> = this.request<RedirectResponse>('PUT', url);
		return response;
	}

	getConsentRequest(challenge: string): Promise<ConsentResponse> {
		throw new NotImplementedException();
	}

	getLoginRequest(challenge: string): Promise<LoginResponse> {
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

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		throw new NotImplementedException();
	}

	listOAuth2Clients(limit?: number, offset?: number, client_name?: string, owner?: string): Promise<OauthClient[]> {
		const url: URL = new URL(`${this.hydraUri}/clients`);
		url.search = QueryString.stringify({
			limit,
			offset,
			client_name,
			owner,
		});
		const response: Promise<OauthClient[]> = this.request<OauthClient[]>('GET', url.toString());
		return response;
	}

	getOAuth2Client(id: string): Promise<OauthClient> {
		const response: Promise<OauthClient> = this.request<OauthClient>('GET', `${this.hydraUri}/clients/${id}`);
		return response;
	}

	createOAuth2Client(data: OauthClient): Promise<OauthClient> {
		const response: Promise<OauthClient> = this.request<OauthClient>('POST', `${this.hydraUri}/clients`, data);
		return response;
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
		const response: Promise<OauthClient> = this.request<OauthClient>('PUT', `${this.hydraUri}/clients/${id}`, data);
		return response;
	}

	deleteOAuth2Client(id: string): Promise<void> {
		const response: Promise<void> = this.request<void>('DELETE', `${this.hydraUri}/clients/${id}`);
		return response;
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
