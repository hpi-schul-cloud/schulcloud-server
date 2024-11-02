import { CreateJwtPayload, ICurrentUser, JwtPayloadFactory } from '@infra/auth-guard';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Account, AccountService } from '@modules/account';
import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { System, SystemService } from '@modules/system';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@shared/domain/entity';
import { Logger } from '@src/core/logger';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthenticationConfig } from '../authentication-config';
import { BruteForceError, UnauthorizedLoggableException } from '../errors';
import { JwtWhitelistAdapter } from '../helper/jwt-whitelist.adapter';
import { ShdUserCreateTokenLoggable } from '../loggable';
import { UserAccountDeactivatedLoggableException } from '../loggable/user-account-deactivated-exception';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<AuthenticationConfig, true>,
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		private readonly systemService: SystemService,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: EncryptionService,
		private readonly logger: Logger
	) {
		this.logger.setContext(AuthenticationService.name);
	}

	public async loadAccount(username: string, systemId?: string): Promise<Account> {
		let account: Account | undefined | null;

		if (systemId) {
			account = await this.accountService.findByUsernameAndSystemId(username, systemId);
		} else {
			const [accounts] = await this.accountService.searchByUsernameExactMatch(username);
			account = accounts.find((foundAccount) => foundAccount.systemId == null);
		}

		if (!account) {
			throw new UnauthorizedLoggableException(username, systemId);
		}
		if (account.deactivatedAt !== undefined && account.deactivatedAt.getTime() <= Date.now()) {
			throw new UserAccountDeactivatedLoggableException();
		}

		return account;
	}

	private async generateJwt(createJwtPayload: CreateJwtPayload, expiresIn?: number | string): Promise<string> {
		const jti = randomUUID();
		const accessToken = this.jwtService.sign(createJwtPayload, {
			subject: createJwtPayload.accountId,
			jwtid: jti,
			expiresIn,
		});

		await this.jwtWhitelistAdapter.addToWhitelist(createJwtPayload.accountId, jti);

		return accessToken;
	}

	public async generateCurrentUserJwt(currentUser: ICurrentUser): Promise<string> {
		const createJwtPayload = JwtPayloadFactory.buildFromCurrentUser(currentUser);
		const expiresIn = this.configService.get<string>('JWT_LIFETIME');
		const jwtToken = await this.generateJwt(createJwtPayload, expiresIn);

		return jwtToken;
	}

	public async generateSupportJwt(supportUser: User, targetUser: User): Promise<string> {
		const targetUserAccount = await this.accountService.findByUserIdOrFail(targetUser.id);
		const currentUser = CurrentUserMapper.userToICurrentUser(
			targetUserAccount.id,
			targetUser,
			false,
			targetUserAccount.systemId
		);
		const createJwtPayload = JwtPayloadFactory.buildFromSupportUser(currentUser, supportUser.id);
		const expiresIn = this.configService.get<number>('JWT_LIFETIME_SUPPORT_SECONDS');

		const jwtToken = await this.generateJwt(createJwtPayload, expiresIn);

		this.logger.info(new ShdUserCreateTokenLoggable(supportUser.id, targetUser.id, expiresIn));

		return jwtToken;
	}

	public async removeJwtFromWhitelist(jwtToken: string): Promise<void> {
		const decodedJwt: JwtPayload | null = jwt.decode(jwtToken, { json: true });

		if (this.isValidJwt(decodedJwt)) {
			await this.jwtWhitelistAdapter.removeFromWhitelist(decodedJwt.accountId, decodedJwt.jti);
		}
	}

	private isValidJwt(decodedJwt: JwtPayload | null): decodedJwt is { accountId: string; jti: string } {
		return typeof decodedJwt?.jti === 'string' && typeof decodedJwt?.accountId === 'string';
	}

	public checkBrutForce(account: Account): void {
		if (account.lasttriedFailedLogin) {
			const timeDifference = (new Date().getTime() - account.lasttriedFailedLogin.getTime()) / 1000;

			if (timeDifference < this.configService.get<number>('LOGIN_BLOCK_TIME')) {
				const timeToWait = this.configService.get<number>('LOGIN_BLOCK_TIME') - Math.ceil(timeDifference);
				throw new BruteForceError(timeToWait, `Brute Force Prevention! Time to wait: ${timeToWait} s`);
			}
		}
	}

	public async updateLastLogin(accountId: string): Promise<void> {
		await this.accountService.updateLastLogin(accountId, new Date());
	}

	public async updateLastTriedFailedLogin(id: string): Promise<void> {
		await this.accountService.updateLastTriedFailedLogin(id, new Date());
	}

	public normalizeUsername(username: string): string {
		return username.trim().toLowerCase();
	}

	public normalizePassword(password: string): string {
		return password.trim();
	}

	public async logoutFromExternalSystem(userId: string, systemId: string): Promise<void> {
		const system: System | null = await this.systemService.findById(systemId);
		const sessionToken: OauthSessionToken | null = await this.oauthSessionTokenService.findLatestByUserId(userId);

		if (!sessionToken) {
			return;
		}

		const now = new Date();
		if (now > sessionToken.expiresAt) {
			await this.oauthSessionTokenService.delete(sessionToken);
			return;
		}

		const headers: AxiosHeaders = new AxiosHeaders();
		headers.setContentType('application/x-www-form-urlencoded');

		const config: AxiosRequestConfig = {
			auth: {
				username: system?.oauthConfig?.clientId as string,
				password: this.oAuthEncryptionService.decrypt(system?.oauthConfig?.clientSecret as string),
			},
			headers,
		};

		if (!system?.oauthConfig?.endSessionEndpoint) {
			// TODO throw error
			return;
		}

		const response: AxiosResponse = await firstValueFrom(
			this.httpService.post(
				system?.oauthConfig?.endSessionEndpoint,
				{
					refresh_token: sessionToken.refreshToken,
				},
				config
			)
		);

		if (response.status !== 204) {
			// TODO throw error
		}

		await this.oauthSessionTokenService.delete(sessionToken);
	}
}
