import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ICurrentUser } from '@shared/domain';
import { IAccountConfig } from '@src/modules/account';
import { AccountService } from '../../account/services/account.service';
import { AccountDto } from '../../account/services/dto';
import { BruteForceError } from '../errors/brute-force.error';

@Injectable()
export class AuthenticationService {
	constructor(
		private jwtService: JwtService,
		private accountService: AccountService,
		private readonly configService: ConfigService<IAccountConfig, true>
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
	generateJwt(user: ICurrentUser) {
		return { accessToken: this.jwtService.sign({ ...user, sub: user.accountId }) };
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

	async updateLastTriedFailedLogin(id: string) {
		await this.accountService.updateLastTriedFailedLogin(id, new Date());
	}
}
