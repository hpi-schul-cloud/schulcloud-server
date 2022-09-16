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
	abstract getLoginRequest(challenge: string): LoginResponse;

	abstract acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): RedirectResponse;

	abstract rejectLoginRequest(challenge: string, body: RejectRequestBody): RedirectResponse;

	abstract getConsentRequest(challenge: string): ConsentResponse;

	abstract acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): RedirectResponse;

	abstract rejectConsentRequest(challenge: string, body: RejectRequestBody): RedirectResponse;

	abstract acceptLogoutRequest(challenge: string): RedirectResponse;

	abstract introspectOAuth2Token(token: string, scope?: string): IntrospectResponse;

	abstract isInstanceAlive(): boolean;

	abstract listOAuth2Clients(): OauthClient[];

	abstract createOAuth2Client(data: OauthClient): OauthClient;

	abstract getOAuth2Client(id: string): OauthClient;

	abstract updateOAuth2Client(id: string, data: OauthClient): OauthClient;

	abstract deleteOAuth2Client(id: string): void;

	abstract listConsentSessions(user: string): ConsentSessionResponse[];

	abstract revokeConsentSession(user: string, client: string): void;
}
