import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { StrategyType } from '../interface';
import { IdTokenExtractionFailureLoggableException, OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { AccountService } from '@modules/account';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { ICurrentUser } from '@infra/auth-guard';
import { CurrentUserMapper } from '../mapper';
import { ErwinAuthorizationBodyParams } from '../controllers/dto';
import {
	SchoolInMigrationLoggableException,
	AccountNotFoundLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';

@Injectable()
export class ErwinStrategy extends PassportStrategy(Strategy, StrategyType.ERWIN) {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly accountService: AccountService,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig
	) {
		super();
	}

	public async validate(request: { body: ErwinAuthorizationBodyParams }): Promise<ICurrentUser> {
		const { accessToken } = request.body;
		if (!accessToken) {
			throw new IdTokenExtractionFailureLoggableException('accessToken');
		}

		const tokenDto = (await this.oauthService.authenticateUser('', '', accessToken)) as {
			claims?: { systemId?: string };
			systemId?: string;
			idToken: string;
			accessToken: string;
		};

		const systemId: string | undefined = tokenDto?.claims?.systemId ?? tokenDto?.systemId;

		if (!systemId) {
			throw new IdTokenExtractionFailureLoggableException('systemId');
		}

		const user = await this.oauthService.provisionUser(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (!user || !user.id) {
			throw new SchoolInMigrationLoggableException();
		}

		const account = await this.accountService.findByUserId(user.id);
		if (!account) {
			throw new AccountNotFoundLoggableException();
		}

		if (account.deactivatedAt && account.deactivatedAt.getTime() <= Date.now()) {
			throw new UserAccountDeactivatedLoggableException();
		}

		const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account.id, user, systemId, true);
		return currentUser;
	}
}
