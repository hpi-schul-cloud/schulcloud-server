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

	acceptLogoutRequest(challenge: string): Promise<RedirectResponse> {
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

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
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
