import { LegacyLogger } from '@infra/logger';
import { AccountService } from '@modules/account';
import { OAuthService, OauthSessionToken, OauthSessionTokenFactory, OauthSessionTokenService } from '@modules/oauth';
import { Inject, Injectable } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextResult } from '../interface';
import {
	AccountNotFoundLoggableException,
	MissingRefreshTokenLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';

export { Oauth2ContextResult } from '../interface';

@Injectable()
export class Oauth2ContextHelper {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(Oauth2ContextHelper.name);
	}

	public async buildOauth2Context(params: Oauth2AuthorizationBodyParams): Promise<Oauth2ContextResult> {
		const { systemId, redirectUri, code } = params;

		this.logger.log('OAuth2 starting login context construction');
		const tokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const user = await this.oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (!user || !user.id) {
			throw new SchoolInMigrationLoggableException();
		}
		const externalUserId = user.externalId;
		const userId = user.id;

		this.logger.log(`OAuth2 starting user account lookup${this.formatUserIdentifier(externalUserId, userId)}`);
		const account = await this.accountService.findByUserId(user.id);
		this.logger.log(`OAuth2 finished user account lookup${this.formatUserIdentifier(externalUserId, userId)}`);
		if (!account) {
			throw new AccountNotFoundLoggableException();
		}

		if (account.deactivatedAt !== undefined && account.deactivatedAt.getTime() <= Date.now()) {
			throw new UserAccountDeactivatedLoggableException();
		}

		if (this.config.externalSystemLogoutEnabled) {
			if (!tokenDto.refreshToken) {
				throw new MissingRefreshTokenLoggableException(systemId);
			}

			const oauthSessionToken: OauthSessionToken = OauthSessionTokenFactory.build({
				userId: user.id,
				systemId,
				refreshToken: tokenDto.refreshToken,
			});

			this.logger.log(`OAuth2 starting session token persistence${this.formatUserIdentifier(externalUserId, userId)}`);
			await this.oauthSessionTokenService.save(oauthSessionToken);
			this.logger.log(`OAuth2 finished session token persistence${this.formatUserIdentifier(externalUserId, userId)}`);
		}

		this.logger.log(`OAuth2 finished login context construction${this.formatUserIdentifier(externalUserId, userId)}`);
		return { user, account, tokenDto, systemId };
	}

	private formatUserIdentifier(externalUserId?: string, userId?: string): string {
		const identifiers = [
			externalUserId ? `externalUserId=${externalUserId}` : undefined,
			userId ? `userId=${userId}` : undefined,
		].filter((identifier): identifier is string => Boolean(identifier));

		return identifiers.length ? ` [${identifiers.join(' ')}]` : '';
	}
}
