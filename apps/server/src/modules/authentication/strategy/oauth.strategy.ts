import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { LegacyLogger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Strategy } from 'passport-custom';
import { OAuthSSOError } from '../../oauth/error/oauth-sso.error';
import { SSOErrorCode } from '../../oauth/error/sso-error-code.enum';
import { RoleService } from '../../role';
import { RoleDto } from '../../role/service/dto/role.dto';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { OauthAuthorizationParams } from './dtos/oauth-authorization.params';

export type PathParams = { systemId?: string };

@Injectable()
export class OauthStrategy extends PassportStrategy(Strategy, 'oauth') {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly roleService: RoleService,
		private readonly logger: LegacyLogger
	) {
		super();
		this.logger.setContext(OauthStrategy.name);
	}

	async validate(request: { params: PathParams; query: OauthAuthorizationParams }): Promise<ICurrentUser | unknown> {
		if (!request.params.systemId) {
			throw new BadRequestException(request.params.systemId, 'No SystemId provided!');
		}
		try {
			const redirectUri: string = this.oauthService.getRedirectUri(false);

			const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(
				request.params.systemId,
				redirectUri,
				request.query.code,
				request.query.error
			);

			const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
				request.params.systemId,
				tokenDto.idToken,
				tokenDto.accessToken
			);

			request.query = { ...request.params, redirect };

			const currentUser: ICurrentUser | unknown = await this.loadICurrentUser(request.params.systemId, user);
			return currentUser;
		} catch (error) {
			const errorCode: string = error instanceof OAuthSSOError ? error.errorcode : SSOErrorCode.SSO_OAUTH_LOGIN_FAILED;
			const errorRedirect: string = this.oauthService.createErrorRedirect(errorCode);

			request.query = { ...request.params, redirect: errorRedirect };

			return {};
		}
	}

	private async loadICurrentUser(systemId: string, user?: UserDO): Promise<ICurrentUser | unknown> {
		if (!user || !user.id) {
			return {};
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
