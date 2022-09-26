import { OauthClient } from '@shared/infra/oauth-provider/dto/interface/oauth-client.interface';
import { ConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
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
	abstract getLoginRequest(challenge: string): Promise<LoginResponse>;

	abstract acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<RedirectResponse>;

	abstract rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse>;

	abstract getConsentRequest(challenge: string): Promise<ConsentResponse>;

	abstract acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<RedirectResponse>;

	abstract rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<RedirectResponse>;

	abstract acceptLogoutRequest(challenge: string): Promise<RedirectResponse>;

	abstract introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse>;

	abstract isInstanceAlive(): Promise<boolean>;

	abstract listOAuth2Clients(
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<OauthClient[]>;

	abstract createOAuth2Client(data: OauthClient): Promise<OauthClient>;

	abstract getOAuth2Client(id: string): Promise<OauthClient>;

	abstract updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient>;

	abstract deleteOAuth2Client(id: string): Promise<void>;

	abstract listConsentSessions(user: string): Promise<ConsentSessionResponse[]>;

	abstract revokeConsentSession(user: string, client: string): Promise<void>;
}
