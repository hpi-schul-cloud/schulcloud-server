import { CurrentUserInterface } from './user';

export interface OauthCurrentUser extends CurrentUserInterface {
	/** Contains the idToken of the external idp. Will be set during oAuth2 login and used for rp initiated logout  */
	externalIdToken?: string;
}
