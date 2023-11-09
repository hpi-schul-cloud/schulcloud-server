import { OauthCurrentUser } from '@modules/authentication/interface';
import { AuthenticationService } from '@modules/authentication/services/authentication.service';
import { SystemService } from '@modules/system';
import { SystemDto } from '@modules/system/service/dto/system.dto';
import { UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, UserDO } from '@shared/domain';
import { ISession } from '@shared/domain/types/session';
import { LegacyLogger } from '@src/core/logger';
import { nanoid } from 'nanoid';
import { OAuthTokenDto } from '../interface';
import { OAuthProcessDto } from '../service/dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly authenticationService: AuthenticationService,
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauthLogin(
		session: ISession,
		systemId: EntityId,
		migration: boolean,
		postLoginRedirect?: string
	): Promise<string> {
		const state = nanoid(16);

		const system: SystemDto = await this.systemService.findById(systemId);
		if (!system.oauthConfig) {
			throw new UnprocessableEntityException(`Requested system ${systemId} has no oauth configured`);
		}

		const authenticationUrl: string = this.oauthService.getAuthenticationUrl(system.oauthConfig, state, migration);

		session.oauthLoginState = new OauthLoginStateDto({
			state,
			systemId,
			provider: system.oauthConfig.provider,
			postLoginRedirect,
			userLoginMigration: migration,
		});

		return authenticationUrl;
	}

	async processOAuthLogin(cachedState: OauthLoginStateDto, code?: string, error?: string): Promise<OAuthProcessDto> {
		const { state, systemId, postLoginRedirect, userLoginMigration } = cachedState;

		this.logger.debug(`Oauth login process started. [state: ${state}, system: ${systemId}]`);

		const redirectUri: string = this.oauthService.getRedirectUri(userLoginMigration);

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code, error);

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
			systemId,
			tokenDto.idToken,
			tokenDto.accessToken,
			postLoginRedirect
		);

		this.logger.debug(`Generating jwt for user. [state: ${state}, system: ${systemId}]`);

		let jwt: string | undefined;
		if (user && user.id) {
			jwt = await this.getJwtForUser(user.id);
		}

		const response = new OAuthProcessDto({
			jwt,
			redirect,
		});

		return response;
	}

	private async getJwtForUser(userId: EntityId): Promise<string> {
		const oauthCurrentUser: OauthCurrentUser = await this.userService.getResolvedUser(userId);

		const { accessToken } = await this.authenticationService.generateJwt(oauthCurrentUser);

		return accessToken;
	}
}
