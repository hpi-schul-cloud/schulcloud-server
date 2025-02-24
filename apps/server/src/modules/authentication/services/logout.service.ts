import { ICurrentUser } from '@infra/auth-guard';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Account, AccountService } from '@modules/account';
import { OauthConfigMissingLoggableException, OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { System, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { AxiosError, AxiosHeaders, AxiosRequestConfig } from 'axios';
import jwt from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { EndSessionEndpointNotFoundLoggableException, ExternalSystemLogoutFailedLoggableException } from '../errors';
import { AccountSystemMismatchLoggableException, InvalidTokenLoggableException } from '../loggable';

@Injectable()
export class LogoutService {
	constructor(
		private readonly systemService: SystemService,
		private readonly oauthService: OAuthService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(DefaultEncryptionService) private readonly oauthEncryptionService: EncryptionService,
		private readonly httpService: HttpService
	) {}

	public async getAccountFromLogoutToken(logoutToken: string): Promise<Account> {
		const decodedLogoutToken = jwt.decode(logoutToken, { json: true });

		if (!decodedLogoutToken || !decodedLogoutToken.iss || !decodedLogoutToken.sub) {
			throw new InvalidTokenLoggableException();
		}

		const system = await this.systemService.findByOauth2Issuer(decodedLogoutToken.iss);

		if (!system?.oauthConfig) {
			throw new NotFoundLoggableException(System.name, { 'oauthConfig.issuer': decodedLogoutToken.iss });
		}

		await this.oauthService.validateLogoutToken(logoutToken, system.oauthConfig);

		const externalId = decodedLogoutToken.sub;

		const user = await this.userService.findByExternalId(externalId, system.id);

		if (!user?.id) {
			throw new NotFoundLoggableException('User', { externalId, systemId: system.id });
		}

		const account = await this.accountService.findByUserId(user.id);

		if (!account) {
			throw new NotFoundLoggableException(Account.name, { userId: user.id });
		}

		if (account.systemId !== system.id) {
			throw new AccountSystemMismatchLoggableException(account.systemId, system.id);
		}

		return account;
	}

	public async externalSystemLogout(user: ICurrentUser): Promise<void> {
		if (!user.systemId) {
			return;
		}

		const system = await this.systemService.findById(user.systemId);
		if (!system) {
			return;
		}

		if (!system.oauthConfig) {
			throw new OauthConfigMissingLoggableException(system.id);
		}

		if (!system.oauthConfig.endSessionEndpoint) {
			throw new EndSessionEndpointNotFoundLoggableException(system.id);
		}

		const sessionToken = await this.oauthSessionTokenService.findLatestByUserId(user.userId);
		if (!sessionToken) {
			return;
		}

		if (!sessionToken.expiresAt || new Date() > sessionToken.expiresAt) {
			await this.oauthSessionTokenService.delete(sessionToken);
			return;
		}

		try {
			const headers: AxiosHeaders = new AxiosHeaders();
			headers.setContentType('application/x-www-form-urlencoded');
			const config: AxiosRequestConfig = {
				auth: {
					username: system.oauthConfig.clientId,
					password: this.oauthEncryptionService.decrypt(system.oauthConfig.clientSecret),
				},
				headers,
			};

			await firstValueFrom(
				this.httpService.post(
					system.oauthConfig.endSessionEndpoint,
					{ refresh_token: sessionToken.refreshToken },
					config
				)
			);
		} catch (err) {
			const axiosError = err as AxiosError;
			throw new ExternalSystemLogoutFailedLoggableException(sessionToken.userId, system.id, axiosError);
		}

		await this.oauthSessionTokenService.delete(sessionToken);
	}
}
