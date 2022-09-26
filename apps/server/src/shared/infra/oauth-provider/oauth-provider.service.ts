import { NotImplementedException } from '@nestjs/common/exceptions/not-implemented.exception';
import { OauthClient } from '@shared/infra/oauth-provider/dto/interface/oauth-client.interface';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	ConsentResponse,
	IntrospectResponse,
	LoginResponse,
	RedirectResponse,
	RejectRequestBody,
} from './dto';

export abstract class OauthProviderService {
	getLoginRequest(challenge: string): Promise<LoginResponse> {
		throw new NotImplementedException();
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	getConsentRequest(challenge: string): Promise<ConsentResponse> {
		throw new NotImplementedException();
	}

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	acceptLogoutRequest(challenge: string): Promise<RedirectResponse> {
		throw new NotImplementedException();
	}

	introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse> {
		throw new NotImplementedException();
	}

	isInstanceAlive(): Promise<boolean> {
		throw new NotImplementedException();
	}

	listOAuth2Clients(limit?: number, offset?: number, client_name?: string, owner?: string): Promise<OauthClient[]> {
		throw new NotImplementedException();
	}

	createOAuth2Client(data: OauthClient): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	getOAuth2Client(id: string): Promise<OauthClient> {
		throw new NotImplementedException();
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
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
