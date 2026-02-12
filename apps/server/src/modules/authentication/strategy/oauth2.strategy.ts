/* eslint-disable filename-rules/match */
import type { ICurrentUser } from '@infra/auth-guard';
import { AccountService } from '@modules/account';
import { OAuthService, OauthSessionToken, OauthSessionTokenFactory, OauthSessionTokenService } from '@modules/oauth';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { StrategyType } from '../interface';
import {
	AccountNotFoundLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, StrategyType.OAUTH2) {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig
	) {
		super();
	}

	public async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const { systemId, redirectUri, code } = request.body;

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
			const oauthSessionToken: OauthSessionToken = OauthSessionTokenFactory.build({
				userId: user.id,
				systemId,
				refreshToken: tokenDto.refreshToken,
			});

			await this.oauthSessionTokenService.save(oauthSessionToken);
		}

		const currentUser = CurrentUserMapper.mapToOauthCurrentUser(account.id, user, systemId, tokenDto.idToken);

		return currentUser;
	}
}
