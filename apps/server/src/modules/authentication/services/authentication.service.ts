import { AccountService, Account } from '@modules/account';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// invalid import, can produce dependency cycles
import type { ServerConfig } from '@modules/server';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BruteForceError, UnauthorizedLoggableException } from '../errors';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { JwtValidationAdapter } from '../helper/jwt-validation.adapter';
import { LoginDto } from '../uc/dto';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly jwtValidationAdapter: JwtValidationAdapter,
		private readonly accountService: AccountService,
		private readonly configService: ConfigService<ServerConfig, true>
	) {}

	async loadAccount(username: string, systemId?: string): Promise<Account> {
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

		if (this.isValidJwt(decodedJwt)) {
			await this.jwtValidationAdapter.removeFromWhitelist(decodedJwt.accountId, decodedJwt.jti);
		}
	}

	private isValidJwt(decodedJwt: JwtPayload | null): decodedJwt is { accountId: string; jti: string } {
		return typeof decodedJwt?.jti === 'string' && typeof decodedJwt?.accountId === 'string';
	}

	checkBrutForce(account: Account): void {
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
