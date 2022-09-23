import { Injectable } from '@nestjs/common';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { OauthProviderService } from '../oauth-provider.service';
import { IntrospectResponse, RedirectResponse } from '../dto';

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
