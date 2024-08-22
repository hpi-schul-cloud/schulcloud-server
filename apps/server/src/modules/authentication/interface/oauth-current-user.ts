import { ICurrentUser } from '@infra/auth-guard';

export interface OauthCurrentUser extends ICurrentUser {
	/** Contains the idToken of the external idp. Will be set during oAuth2 login and used for rp initiated logout  */
	externalIdToken?: string;
}
