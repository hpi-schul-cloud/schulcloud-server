import type { ICurrentUser } from '@infra/auth-guard';
import { Account, AccountService } from '@modules/account';
import { OAuthService, OauthSessionToken, OauthSessionTokenFactory, OauthSessionTokenService } from '@modules/oauth';
import { OAuthTokenDto } from '@modules/oauth-adapter';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { UserDO } from '@shared/domain/domainobject';
import { Strategy } from 'passport-custom';
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
		private readonly oauthSessionTokenService: OauthSessionTokenService
	) {
		super();
	}

	public async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const { systemId, redirectUri, code } = request.body;

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const user: UserDO | null = await this.oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (!user || !user.id) {
			throw new SchoolInMigrationLoggableException();
		}

		const account: Account | null = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new AccountNotFoundLoggableException();
		}

		if (account.deactivatedAt !== undefined && account.deactivatedAt.getTime() <= Date.now()) {
			throw new UserAccountDeactivatedLoggableException();
		}

		const oauthSessionToken: OauthSessionToken = OauthSessionTokenFactory.build({
			userId: user.id,
			systemId,
			refreshToken: tokenDto.refreshToken,
		});

		await this.oauthSessionTokenService.save(oauthSessionToken);

		const currentUser: ICurrentUser = CurrentUserMapper.mapToOauthCurrentUser(
			account.id,
			user,
			systemId,
			tokenDto.idToken
		);

		return currentUser;
	}
}
