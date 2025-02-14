import { Logger } from '@core/logger';
import { CreateJwtPayload, ICurrentUser, JwtPayloadFactory } from '@infra/auth-guard';
import { Account, AccountService } from '@modules/account';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { User } from '@shared/domain/entity';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticationConfig } from '../authentication-config';
import { BruteForceError, UnauthorizedLoggableException } from '../errors';
import { JwtWhitelistAdapter } from '../helper/jwt-whitelist.adapter';
import { ShdUserCreateTokenLoggable, UserAccountDeactivatedLoggableException } from '../loggable';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<AuthenticationConfig, true>,
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

	private async generateJwtAndAddToWhitelist(
		createJwtPayload: CreateJwtPayload,
		expiresIn?: number | string
	): Promise<string> {
		const jti = randomUUID();
		const options: JwtSignOptions = {
			subject: createJwtPayload.accountId,
			jwtid: jti,
		};

		// It is necessary to set expiresIn conditionally like this, because setting it to undefined in the JwtSignOptions overwrites the value from the JwtModuleOptions.
		if (expiresIn) {
			options.expiresIn = expiresIn;
		}

		const accessToken = this.jwtService.sign(createJwtPayload, options);

		await this.jwtWhitelistAdapter.addToWhitelist(createJwtPayload.accountId, jti);

		return accessToken;
	}

	public async generateCurrentUserJwt(currentUser: ICurrentUser): Promise<string> {
		const createJwtPayload = JwtPayloadFactory.buildFromCurrentUser(currentUser);
		const jwtToken = await this.generateJwtAndAddToWhitelist(createJwtPayload);

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

		const jwtToken = await this.generateJwtAndAddToWhitelist(createJwtPayload, expiresIn);

		this.logger.info(new ShdUserCreateTokenLoggable(supportUser.id, targetUser.id, expiresIn));

		return jwtToken;
	}

	public async removeJwtFromWhitelist(jwtToken: string): Promise<void> {
		const decodedJwt: JwtPayload | null = jwt.decode(jwtToken, { json: true });

		if (this.isValidJwt(decodedJwt)) {
			await this.jwtWhitelistAdapter.removeFromWhitelist(decodedJwt.accountId, decodedJwt.jti);
		}
	}

	public async removeUserFromWhitelist(account: Account): Promise<void> {
		await this.jwtWhitelistAdapter.removeFromWhitelist(account.id);
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
}
