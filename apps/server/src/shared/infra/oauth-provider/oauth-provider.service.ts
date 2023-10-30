import { ProviderOauthClient } from './dto/interface/oauth-client.interface';
import { AcceptConsentRequestBody } from './dto/request/accept-consent-request.body';
import { AcceptLoginRequestBody } from './dto/request/accept-login-request.body';
import { RejectRequestBody } from './dto/request/reject-request.body';
import { ProviderConsentSessionResponse } from './dto/response/consent-session.response';
import { ProviderConsentResponse } from './dto/response/consent.response';
import { IntrospectResponse } from './dto/response/introspect.response';
import { ProviderLoginResponse } from './dto/response/login.response';
import { ProviderRedirectResponse } from './dto/response/redirect.response';

export abstract class OauthProviderService {
	abstract getLoginRequest(challenge: string): Promise<ProviderLoginResponse>;

	abstract acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse>;

	abstract rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	abstract getConsentRequest(challenge: string): Promise<ProviderConsentResponse>;

	abstract acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<ProviderRedirectResponse>;

	abstract rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	abstract acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse>;

	abstract introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse>;

	abstract isInstanceAlive(): Promise<boolean>;

	abstract listOAuth2Clients(
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]>;

	abstract createOAuth2Client(data: ProviderOauthClient): Promise<ProviderOauthClient>;

	abstract getOAuth2Client(id: string): Promise<ProviderOauthClient>;

	abstract updateOAuth2Client(id: string, data: ProviderOauthClient): Promise<ProviderOauthClient>;

	abstract deleteOAuth2Client(id: string): Promise<void>;

	abstract listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]>;

	abstract revokeConsentSession(user: string, client: string): Promise<void>;
}
