import { type Account } from '@modules/account';
import { type UserDo } from '@modules/user';

export interface Oauth2ContextResult {
	user: UserDo;
	account: Account;
	tokenDto: {
		idToken: string;
		accessToken: string;
		refreshToken?: string;
	};
	systemId: string;
}
