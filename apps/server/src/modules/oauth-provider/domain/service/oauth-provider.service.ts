import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	IntrospectResponse,
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '../interface';

export abstract class OauthProviderService {
	public abstract getLoginRequest(challenge: string): Promise<ProviderLoginResponse>;

	public abstract acceptLoginRequest(
		challenge: string,
		body: AcceptLoginRequestBody
	): Promise<ProviderRedirectResponse>;

	public abstract rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	public abstract getConsentRequest(challenge: string): Promise<ProviderConsentResponse>;

	public abstract acceptConsentRequest(
		challenge: string,
		body: AcceptConsentRequestBody
	): Promise<ProviderRedirectResponse>;

	public abstract rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse>;

	public abstract acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse>;

	public abstract introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse>;

	public abstract isInstanceAlive(): Promise<boolean>;

	public abstract listOAuth2Clients(
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]>;

	public abstract createOAuth2Client(data: Partial<ProviderOauthClient>): Promise<ProviderOauthClient>;

	public abstract getOAuth2Client(id: string): Promise<ProviderOauthClient>;

	public abstract updateOAuth2Client(id: string, data: Partial<ProviderOauthClient>): Promise<ProviderOauthClient>;

	public abstract deleteOAuth2Client(id: string): Promise<void>;

	public abstract listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]>;

	public abstract revokeConsentSession(user: string, client: string): Promise<void>;
}
