import { AccountService, Account } from '@modules/account';
import { OAuthService, OAuthTokenDto } from '@modules/oauth';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Strategy } from 'passport-custom';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { ICurrentUser, OauthCurrentUser } from '../interface';
import { SchoolInMigrationLoggableException } from '../loggable';
import { CurrentUserMapper } from '../mapper';
import { UserAccountDeactivatedException } from '../loggable/user-account-deactivated-exception';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
	constructor(private readonly oauthService: OAuthService, private readonly accountService: AccountService) {
		super();
	}

	async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const { systemId, redirectUri, code } = request.body;

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const user: UserDO | null = await this.oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (!user || !user.id) {
			throw new SchoolInMigrationLoggableException();
		}

		const account: Account | null = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new UnauthorizedException('no account found');
		}

		if (account.deactivatedAt != null && account.deactivatedAt.getDate() <= Date.now()) {
			throw new UserAccountDeactivatedException();
		}

		const currentUser: OauthCurrentUser = CurrentUserMapper.mapToOauthCurrentUser(
			account.id,
			user,
			systemId,
			tokenDto.idToken
		);
		return currentUser;
	}
}
