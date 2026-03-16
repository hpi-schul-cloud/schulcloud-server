import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import jwt from 'jsonwebtoken';
import { ErwinJwtPayload } from '@modules/provisioning';
import { StrategyType } from '../interface';
import { IdTokenExtractionFailureLoggableException, OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { AccountService } from '@modules/account';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { ICurrentUser } from '@infra/auth-guard';
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

		const decoded = jwt.decode(accessToken, { json: true });
		if (!decoded) {
			throw new IdTokenExtractionFailureLoggableException('decode');
		}

		const payload = new ErwinJwtPayload(decoded as Partial<ErwinJwtPayload>);
		const erwinSystemId = payload.systemId;

		const user = await this.oauthService.provisionUser(erwinSystemId || '', '', accessToken);

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

		type UserWithSystemIds = typeof user & {
			systemId?: string;
			provisioningSystemId?: string;
			externalId?: string;
			isExternalUser?: boolean;
		};

		const typedUser = user as UserWithSystemIds;
		const typedAccount = account as { systemId?: string };

		// handling original provisioning systemId if present on user/account
		let effectiveSystemId: string | undefined;
		if (typedUser.systemId) {
			effectiveSystemId = typedUser.systemId;
		} else if (typedAccount.systemId) {
			effectiveSystemId = typedAccount.systemId;
		} else if (typedUser.provisioningSystemId) {
			effectiveSystemId = typedUser.provisioningSystemId;
		}

		let isExternalUser = true;
		if (!effectiveSystemId) {
			if (typedUser.externalId) {
				effectiveSystemId = erwinSystemId;
			} else {
				effectiveSystemId = undefined;
				isExternalUser = false;
			}
		}

		typedUser.systemId = effectiveSystemId;
		typedUser.isExternalUser = isExternalUser;

		// partial ICurrentUser with the necessary info for the auth guard and downstream services
		const currentUser: ICurrentUser = {
			id: account.id,
			user: typedUser,
			account: account,
		} as unknown as ICurrentUser;

		return currentUser;
	}
}
