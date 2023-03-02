/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Strategy } from 'passport-custom';
import { OauthAuthorizationParams } from './dtos/oauth-authorization.params';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';

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

	async validate(request: { params: PathParams; query: OauthAuthorizationParams }): Promise<ICurrentUser | unknown> {
		if (!request.params.systemId) {
			throw new BadRequestException(request.params.systemId, 'No SystemId provided!');
		}
		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			request.params.systemId,
			request.query.code,
			request.query.error
		);
		request.query = { ...request.params, redirect };

		return this.loadICurrentUser(request.params.systemId, user);
	}

	private async loadICurrentUser(systemId: string, user?: UserDO): Promise<ICurrentUser | unknown> {
		if (!user || !user.id) {
			return {};
		}
		const account = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new UnauthorizedException('no account found');
		}
		const currentUser: ICurrentUser = CurrentUserMapper.userDoToICurrentUser(account.id, user, systemId);
		return currentUser;
	}
}
