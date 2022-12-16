/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ICurrentUser } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { CurrentUserMapper } from '@shared/domain/mapper/current-user.mapper';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Strategy } from 'passport-custom';
import { AuthorizationParams } from '../controllers/authorization.params';

export type PathParams = { systemId?: string };

@Injectable()
export class OauthStrategy extends PassportStrategy(Strategy, 'oauth') {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {
		super();
		this.logger.setContext(OauthStrategy.name);
	}

	async validate(request: { params: PathParams; query: AuthorizationParams }): Promise<ICurrentUser> {
		const { systemId } = request.params;
		const { query } = request;

		if (!systemId || !query.code) {
			throw new UnauthorizedException();
		}
		this.logger.debug(`Oauth process started for systemId ${systemId}`);
		if (query.error) {
			throw new UnauthorizedException(
				'Authorization Query Object has no authorization code or error',
				query.error || 'sso_auth_code_step'
			);
		}

		const { user, redirect }: { user: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			query.code,
			systemId
		);
		request.query = { ...request.params, redirect };
		if (!user.id) {
			throw new UnauthorizedException();
		}
		const account = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new UnauthorizedException();
		}

		const currentUser: ICurrentUser = CurrentUserMapper.userDoToICurrentUser(account.id, user, systemId);
		return currentUser;
	}
}
