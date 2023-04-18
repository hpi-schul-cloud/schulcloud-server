import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { JwtValidationAdapter } from '@src/modules/authentication/strategy/jwt-validation.adapter';
import type { IServerConfig } from '@src/modules/server';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BruteForceError } from '../errors/brute-force.error';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { LoginDto } from '../uc/dto';

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

	async generateJwt(user: CreateJwtPayload): Promise<LoginDto> {
		const jti = randomUUID();

		const result: LoginDto = new LoginDto({
			accessToken: this.jwtService.sign(user, {
				subject: user.accountId,
				jwtid: jti,
			}),
		});

		await this.jwtValidationAdapter.addToWhitelist(user.accountId, jti);

		return result;
	}

	async removeJwtFromWhitelist(jwtToken: string): Promise<void> {
		const decodedJwt: JwtPayload | null = jwt.decode(jwtToken, { json: true });

		if (decodedJwt && decodedJwt.jti && decodedJwt.accountId && typeof decodedJwt.accountId === 'string') {
			await this.jwtValidationAdapter.removeFromWhitelist(decodedJwt.accountId, decodedJwt.jti);
		}
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
