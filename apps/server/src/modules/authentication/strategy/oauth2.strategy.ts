import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Strategy } from 'passport-custom';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { SchoolInMigrationError } from '../errors/school-in-migration.error';
import { ICurrentUser, OauthCurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
	constructor(private readonly oauthService: OAuthService, private readonly accountService: AccountService) {
		super();
	}

	async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const { systemId, redirectUri, code } = request.body;

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const { user }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
			systemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		if (!user || !user.id) {
			throw new SchoolInMigrationError();
		}

		const account: AccountDto | null = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new UnauthorizedException('no account found');
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
