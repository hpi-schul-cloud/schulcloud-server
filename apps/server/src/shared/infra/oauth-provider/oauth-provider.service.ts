import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto/interface/oauth-client.interface';
import { ConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	ProviderConsentResponse,
	IntrospectResponse,
	LoginResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from './dto';

export abstract class OauthProviderService {
	abstract getLoginRequest(challenge: string): Promise<LoginResponse>;

	abstract acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse>;

	abstract rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	abstract getConsentRequest(challenge: string): Promise<ProviderConsentResponse>;

	abstract acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<ProviderRedirectResponse>;

	abstract rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	abstract acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse>;

	abstract introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse>;

	abstract isInstanceAlive(): Promise<boolean>;

	abstract listOAuth2Clients(): Promise<ProviderOauthClient[]>;

	abstract createOAuth2Client(data: ProviderOauthClient): Promise<ProviderOauthClient>;

	abstract getOAuth2Client(id: string): Promise<ProviderOauthClient>;

	abstract updateOAuth2Client(id: string, data: ProviderOauthClient): Promise<ProviderOauthClient>;

	abstract deleteOAuth2Client(id: string): Promise<void>;

	abstract listConsentSessions(user: string): Promise<ConsentSessionResponse[]>;

	abstract revokeConsentSession(user: string, client: string): Promise<void>;
}
