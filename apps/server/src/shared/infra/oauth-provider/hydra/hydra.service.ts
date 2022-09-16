import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
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
	constructor(private readonly httpService: HttpService) {
		super();
	}

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): RedirectResponse {
		throw new NotImplementedException();
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): RedirectResponse {
		throw new NotImplementedException();
	}

	acceptLogoutRequest(challenge: string): RedirectResponse {
		const hydraUri: string = Configuration.get('HYDRA_URI') as string;
		const url = `${hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=${challenge}`;
		const response: Observable<AxiosResponse> = this.httpService.put(url, null, {
			headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https' },
		});
	}

	createOAuth2Client(data: OauthClient): OauthClient {
		throw new NotImplementedException();
	}

	deleteOAuth2Client(id: string): void {
		throw new NotImplementedException();
	}

	getConsentRequest(challenge: string): ConsentResponse {
		throw new NotImplementedException();
	}

	getLoginRequest(challenge: string): LoginResponse {
		throw new NotImplementedException();
	}

	getOAuth2Client(id: string): OauthClient {
		throw new NotImplementedException();
	}

	introspectOAuth2Token(token: string, scope: string): IntrospectResponse {
		throw new NotImplementedException();
	}

	isInstanceAlive(): boolean {
		throw new NotImplementedException();
	}

	listConsentSessions(user: string): ConsentSessionResponse[] {
		throw new NotImplementedException();
	}

	listOAuth2Clients(): OauthClient[] {
		throw new NotImplementedException();
	}

	rejectConsentRequest(challenge: string, body: RejectRequestBody): RedirectResponse {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): RedirectResponse {
		throw new NotImplementedException();
	}

	revokeConsentSession(user: string, client: string): void {
		throw new NotImplementedException();
	}

	updateOAuth2Client(id: string, data: OauthClient): OauthClient {
		throw new NotImplementedException();
	}
}
