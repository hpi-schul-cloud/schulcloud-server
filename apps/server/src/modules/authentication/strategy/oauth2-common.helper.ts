import { AccountService } from '@modules/account';
import { UserDo } from '@modules/user';
import { OAuthService, OauthSessionToken, OauthSessionTokenFactory, OauthSessionTokenService } from '@modules/oauth';
import { AuthenticationConfig } from '../authentication-config';
import {
	AccountNotFoundLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';

export interface Oauth2ContextResult {
	user: UserDo;
	account: { id: string; deactivatedAt?: Date };
	tokenDto: {
		idToken: string;
		accessToken: string;
		refreshToken?: string;
	};
}

export async function buildOauth2Context(
	params: Oauth2AuthorizationBodyParams,
	oauthService: OAuthService,
	accountService: AccountService,
	oauthSessionTokenService: OauthSessionTokenService,
	config: AuthenticationConfig
): Promise<Oauth2ContextResult> {
	const { systemId, redirectUri, code } = params;

	const tokenDto = await oauthService.authenticateUser(systemId, redirectUri, code);

	const user = await oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

	if (!user || !user.id) {
		throw new SchoolInMigrationLoggableException();
	}

	const account = await accountService.findByUserId(user.id);
	if (!account) {
		throw new AccountNotFoundLoggableException();
	}

	if (account.deactivatedAt !== undefined && account.deactivatedAt.getTime() <= Date.now()) {
		throw new UserAccountDeactivatedLoggableException();
	}

	if (config.externalSystemLogoutEnabled) {
		const oauthSessionToken: OauthSessionToken = OauthSessionTokenFactory.build({
			userId: user.id,
			systemId,
			refreshToken: tokenDto.refreshToken,
		});

		await oauthSessionTokenService.save(oauthSessionToken);
	}

	return { user, account, tokenDto };
}
