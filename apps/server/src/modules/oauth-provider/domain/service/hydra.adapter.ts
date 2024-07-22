import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError, Method, RawAxiosRequestHeaders } from 'axios';
import QueryString from 'qs';
import { firstValueFrom, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { URL } from 'url';
import { IOauthProviderFeatures, OauthProviderFeatures } from '../../oauth-provider-config';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	HydraOauthFailedLoggableException,
	IntrospectResponse,
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '../index';
import { OauthProviderService } from './oauth-provider.service';

@Injectable()
export class HydraAdapter extends OauthProviderService {
	constructor(
		private readonly httpService: HttpService,
		@Inject(OauthProviderFeatures) private readonly oauthProviderFeatures: IOauthProviderFeatures
	) {
		super();
	}

	public async acceptConsentRequest(
		challenge: string,
		body: AcceptConsentRequestBody
	): Promise<ProviderRedirectResponse> {
		const response: ProviderRedirectResponse = await this.put<ProviderRedirectResponse>(
			'consent',
			'accept',
			challenge,
			body
		);

		return response;
	}

	public async acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse> {
		const response: ProviderRedirectResponse = await this.put<ProviderRedirectResponse>(
			'login',
			'accept',
			challenge,
			body
		);

		return response;
	}

	public async acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse> {
		const response: ProviderRedirectResponse = await this.put<ProviderRedirectResponse>('logout', 'accept', challenge);

		return response;
	}

	public async getConsentRequest(challenge: string): Promise<ProviderConsentResponse> {
		const response: ProviderConsentResponse = await this.get<ProviderConsentResponse>('consent', challenge);

		return response;
	}

	public async getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		const response: ProviderLoginResponse = await this.get<ProviderLoginResponse>('login', challenge);

		return response;
	}

	public async introspectOAuth2Token(token: string, scope: string): Promise<IntrospectResponse> {
		const response: IntrospectResponse = await this.request<IntrospectResponse>(
			'POST',
			`${this.oauthProviderFeatures.hydraUri}/oauth2/introspect`,
			`token=${token}&scope=${scope}`,
			{ 'Content-Type': 'application/x-www-form-urlencoded' }
		);

		return response;
	}

	public async isInstanceAlive(): Promise<boolean> {
		const response: boolean = await this.request<boolean>('GET', `${this.oauthProviderFeatures.hydraUri}/health/alive`);

		return response;
	}

	public async listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]> {
		const response: ProviderConsentSessionResponse[] = await this.request<ProviderConsentSessionResponse[]>(
			'GET',
			`${this.oauthProviderFeatures.hydraUri}/oauth2/auth/sessions/consent?subject=${user}`
		);

		return response;
	}

	public async rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		const response: ProviderRedirectResponse = await this.put<ProviderRedirectResponse>(
			'consent',
			'reject',
			challenge,
			body
		);

		return response;
	}

	public async rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		const response: ProviderRedirectResponse = await this.put<ProviderRedirectResponse>(
			'login',
			'reject',
			challenge,
			body
		);

		return response;
	}

	public async revokeConsentSession(user: string, client: string): Promise<void> {
		await this.request<void>(
			'DELETE',
			`${this.oauthProviderFeatures.hydraUri}/oauth2/auth/sessions/consent?subject=${user}&client=${client}`
		);
	}

	public async listOAuth2Clients(
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]> {
		const url: URL = new URL(`${this.oauthProviderFeatures.hydraUri}/clients`);
		url.search = QueryString.stringify({
			limit,
			offset,
			client_name,
			owner,
		});

		const response: ProviderOauthClient[] = await this.request<ProviderOauthClient[]>('GET', url.toString());

		return response;
	}

	public async getOAuth2Client(id: string): Promise<ProviderOauthClient> {
		const response: ProviderOauthClient = await this.request<ProviderOauthClient>(
			'GET',
			`${this.oauthProviderFeatures.hydraUri}/clients/${id}`
		);

		return response;
	}

	public async createOAuth2Client(data: Partial<ProviderOauthClient>): Promise<ProviderOauthClient> {
		const response: ProviderOauthClient = await this.request<ProviderOauthClient>(
			'POST',
			`${this.oauthProviderFeatures.hydraUri}/clients`,
			data
		);

		return response;
	}

	public async updateOAuth2Client(id: string, data: Partial<ProviderOauthClient>): Promise<ProviderOauthClient> {
		const response: ProviderOauthClient = await this.request<ProviderOauthClient>(
			'PUT',
			`${this.oauthProviderFeatures.hydraUri}/clients/${id}`,
			data
		);

		return response;
	}

	public async deleteOAuth2Client(id: string): Promise<void> {
		await this.request<void>('DELETE', `${this.oauthProviderFeatures.hydraUri}/clients/${id}`);
	}

	private async put<T>(
		flow: string,
		action: string,
		challenge: string,
		body?: AcceptConsentRequestBody | AcceptLoginRequestBody | RejectRequestBody
	): Promise<T> {
		const putResponse: T = await this.request<T>(
			'PUT',
			`${this.oauthProviderFeatures.hydraUri}/oauth2/auth/requests/${flow}/${action}?${flow}_challenge=${challenge}`,
			body
		);

		return putResponse;
	}

	private async get<T>(flow: string, challenge: string): Promise<T> {
		const getResponse: T = await this.request<T>(
			'GET',
			`${this.oauthProviderFeatures.hydraUri}/oauth2/auth/requests/${flow}?${flow}_challenge=${challenge}`
		);

		return getResponse;
	}

	private async request<T>(
		method: Method,
		url: string,
		data?: unknown,
		additionalHeaders: RawAxiosRequestHeaders = {}
	): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService
			.request({
				url,
				method,
				headers: {
					'X-Forwarded-Proto': 'https',
					...additionalHeaders,
				},
				data,
			})
			.pipe(
				catchError((error: unknown) => {
					if (isAxiosError(error)) {
						throw new HydraOauthFailedLoggableException(error);
					} else {
						throw error;
					}
				})
			);

		const response: AxiosResponse<T> = await firstValueFrom(observable);

		return response.data;
	}
}
