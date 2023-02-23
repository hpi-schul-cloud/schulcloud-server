import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtValidationAdapter } from '@src/modules/authentication/strategy/jwt-validation.adapter';
import { randomUUID } from 'crypto';
import type { IServerConfig } from '@src/modules/server';
import { ICurrentUser } from '../interface';
import { AccountService } from '../../account/services/account.service';
import { AccountDto } from '../../account/services/dto';
import { BruteForceError } from '../errors/brute-force.error';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtValidationAdapter: JwtValidationAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<IServerConfig, true>
	) {}

	async loadAccount(username: string, systemId?: string): Promise<AccountDto> {
		let account: AccountDto | undefined | null;
		if (systemId) {
			account = await this.accountService.findByUsernameAndSystemId(username, systemId);
		} else {
			const foundAccounts = await this.accountService.searchByUsernameExactMatch(username);
			account = foundAccounts.accounts.find((foundAccount) => foundAccount.systemId == null);
		}
		if (!account) {
			throw new UnauthorizedException();
		}
		return account;
	}

	// if user does not contain a systemId the JWT won't contain it, thus the user needs to change his PW during first login
	async generateJwt(user: ICurrentUser): Promise<{ accessToken: string }> {
		const jti = randomUUID();
		const result = {
			accessToken: this.jwtService.sign(user, {
				subject: user.accountId,
				jwtid: jti,
			}),
		};
		await this.jwtValidationAdapter.addToWhitelist(user.accountId, jti);
		return result;
	}

	checkBrutForce(account: AccountDto): void {
		if (account.lasttriedFailedLogin) {
			const timeDifference = (new Date().getTime() - account.lasttriedFailedLogin.getTime()) / 1000;
			if (timeDifference < this.configService.get<number>('LOGIN_BLOCK_TIME')) {
				const timeToWait = this.configService.get<number>('LOGIN_BLOCK_TIME') - Math.ceil(timeDifference);
				throw new BruteForceError(timeToWait, `Brute Force Prevention! Time to wait: ${timeToWait} s`);
			}
		}
	}

	async updateLastTriedFailedLogin(id: string): Promise<void> {
		await this.accountService.updateLastTriedFailedLogin(id, new Date());
	}

	normalizeUsername(username: string): string {
		return username.trim().toLowerCase();
	}

	normalizePassword(password: string): string {
		return password.trim();
	}
}
