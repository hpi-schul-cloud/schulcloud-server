import { Injectable } from '@nestjs/common';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import QueryString from 'qs';
import { URL } from 'url';
import { IntrospectResponse, OauthClient, RedirectResponse } from '../dto';
import { OauthProviderService } from '../oauth-provider.service';

@Injectable()
export class HydraService extends OauthProviderService {
	private readonly hydraUri: string;

	constructor(private readonly httpService: HttpService) {
		super();
		this.hydraUri = Configuration.get('HYDRA_URI') as string;
	}

	async acceptLogoutRequest(challenge: string): Promise<RedirectResponse> {
		const url = `${this.hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=${challenge}`;
		const response: Promise<RedirectResponse> = this.request<RedirectResponse>('PUT', url);
		return response;
	}

	introspectOAuth2Token(token: string, scope: string): Promise<IntrospectResponse> {
		const response: Promise<IntrospectResponse> = this.request<IntrospectResponse>(
			'POST',
			`${this.hydraUri}/oauth2/introspect`,
			`token=${token}&scope=${scope}`,
			{ 'Content-Type': 'application/x-www-form-urlencoded' }
		);
		return response;
	}

	isInstanceAlive(): Promise<boolean> {
		const response: Promise<boolean> = this.request<boolean>('GET', `${this.hydraUri}/health/alive`);
		return response;
	}

	listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]> {
		const response: Promise<ProviderConsentSessionResponse[]> = this.request<ProviderConsentSessionResponse[]>(
			'GET',
			`${this.hydraUri}/oauth2/auth/sessions/consent?subject=${user}`
		);
		return response;
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		const response: Promise<void> = this.request<void>(
			'DELETE',
			`${this.hydraUri}/oauth2/auth/sessions/consent?subject=${user}&client=${client}`
		);
		return response;
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
