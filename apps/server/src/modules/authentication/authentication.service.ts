import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityId, ICurrentUser } from '@shared/domain';
import { AccountService } from '../account/services/account.service';
import { AccountDto } from '../account/services/dto';

@Injectable()
export class AuthenticationService {
	constructor(private jwtService: JwtService, private accountService: AccountService) {}

	async loadAccount(username: string, systemId?: EntityId) {
		const accounts = await this.accountService.searchByUsernameExactMatch(username);
		let foundAccount: AccountDto | undefined;
		if (accounts.accounts.length === 1) {
			[foundAccount] = accounts.accounts;
		}
		if (accounts.accounts.length > 1) {
			foundAccount = accounts.accounts.find((account) => account.systemId === systemId);
		}
		return foundAccount;
	}

	generateJwt(user: ICurrentUser) {
		return { accessToken: this.jwtService.sign({ ...user, sub: user.accountId }) };
	}
}
