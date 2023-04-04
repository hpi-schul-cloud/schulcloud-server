import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountService } from '@src/modules/account/services/account.service';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Strategy } from 'passport-custom';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { Oauth2AuthorizationParams } from '../controllers/dto';
import { SchoolInMigrationError } from '../errors/school-in-migration.error';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly roleService: RoleService
	) {
		super();
	}

	async validate(request: { body: Oauth2AuthorizationParams }): Promise<ICurrentUser> {
		const { systemId, redirectUri, code, error } = request.body;

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code, error);

		const { user }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
			systemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		if (!user || !user.id) {
			// TODO: return schoolId when the user should automatically redirected in frontend
			// for this we have to adjust the provisionUser which increases the complexity
			throw new SchoolInMigrationError();
		}

		const account = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new UnauthorizedException('no account found');
		}

		const roles: RoleDto[] = await this.roleService.findByIds(user.roleIds);

		const currentUser: ICurrentUser = CurrentUserMapper.userDoToICurrentUser(account.id, user, roles, systemId);

		return currentUser;
	}
}
