import { NotImplementedException } from '@nestjs/common/exceptions/not-implemented.exception';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	IntrospectResponse,
	ProviderLoginResponse,
	ProviderConsentResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from './dto';
import { ProviderConsentSessionResponse } from './dto/response/consent-session.response';

export abstract class OauthProviderService {
	getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		throw new NotImplementedException();
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	getConsentRequest(challenge: string): Promise<ProviderConsentResponse> {
		throw new NotImplementedException();
	}

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse> {
		throw new NotImplementedException();
	}

	introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse> {
		throw new NotImplementedException();
	}

	isInstanceAlive(): Promise<boolean> {
		throw new NotImplementedException();
	}

	listOAuth2Clients(
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]> {
		throw new NotImplementedException();
	}

	createOAuth2Client(data: ProviderOauthClient): Promise<ProviderOauthClient> {
		throw new NotImplementedException();
	}

	getOAuth2Client(id: string): Promise<ProviderOauthClient> {
		throw new NotImplementedException();
	}

	updateOAuth2Client(id: string, data: ProviderOauthClient): Promise<ProviderOauthClient> {
		throw new NotImplementedException();
	}

	deleteOAuth2Client(id: string): Promise<void> {
		throw new NotImplementedException();
	}

	listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]> {
		throw new NotImplementedException();
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		throw new NotImplementedException();
	}
}
