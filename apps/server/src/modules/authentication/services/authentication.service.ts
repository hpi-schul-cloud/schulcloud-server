import { CreateJwtPayload } from '@infra/auth-guard';
import { Account, AccountService } from '@modules/account';
import type { ServerConfig } from '@modules/server';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BruteForceError, UnauthorizedLoggableException } from '../errors';
import { JwtWhitelistAdapter } from '../helper/jwt-whitelist.adapter';
import { UserAccountDeactivatedLoggableException } from '../loggable/user-account-deactivated-exception';
import { LoginDto } from '../uc/dto';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<ServerConfig, true> // ServerConfig is wrong
	) {}

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

	public async generateJwt(createJwtPayload: CreateJwtPayload): Promise<LoginDto> {
		const jti = randomUUID();

		const accessToken = this.jwtService.sign(createJwtPayload, {
			subject: createJwtPayload.accountId,
			jwtid: jti,
		});

		const result = new LoginDto({ accessToken });
		await this.jwtWhitelistAdapter.addToWhitelist(createJwtPayload.accountId, jti);

		return result;
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
}
