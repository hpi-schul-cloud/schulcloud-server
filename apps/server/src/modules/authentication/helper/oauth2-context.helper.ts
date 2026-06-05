import { AccountService } from '@modules/account';
import { OAuthService, OauthSessionToken, OauthSessionTokenFactory, OauthSessionTokenService } from '@modules/oauth';
import { Inject, Injectable } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextResult } from '../interface';
import {
	AccountNotFoundLoggableException,
	MissingRefreshTokenLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';

export { Oauth2ContextResult } from '../interface';

@Injectable()
export class Oauth2ContextHelper {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig
	) {}

	public async buildOauth2Context(params: Oauth2AuthorizationBodyParams): Promise<Oauth2ContextResult> {
		const { systemId, redirectUri, code } = params;

		const tokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const user = await this.oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (!user || !user.id) {
			throw new SchoolInMigrationLoggableException();
		}

		const account = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new AccountNotFoundLoggableException();
		}

		if (account.deactivatedAt !== undefined && account.deactivatedAt.getTime() <= Date.now()) {
			throw new UserAccountDeactivatedLoggableException();
		}

		if (this.config.externalSystemLogoutEnabled) {
			if (!tokenDto.refreshToken) {
				throw new MissingRefreshTokenLoggableException(systemId);
			}

			const oauthSessionToken: OauthSessionToken = OauthSessionTokenFactory.build({
				userId: user.id,
				systemId,
				refreshToken: tokenDto.refreshToken,
			});

			await this.oauthSessionTokenService.save(oauthSessionToken);
		}

		return { user, account, tokenDto, systemId };
	}
}
