/* eslint-disable filename-rules/match */
import type { ICurrentUser } from '@infra/auth-guard';
import { AccountService } from '@modules/account';
import { OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { StrategyType } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { buildOauth2Context } from './oauth2-common.helper';

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
		const { user, account, tokenDto } = await buildOauth2Context(
			request.body,
			this.oauthService,
			this.accountService,
			this.oauthSessionTokenService,
			this.config
		);

		const currentUser = CurrentUserMapper.mapToOauthCurrentUser(
			account.id,
			user,
			request.body.systemId,
			tokenDto.idToken
		);
		return currentUser;
	}
}
