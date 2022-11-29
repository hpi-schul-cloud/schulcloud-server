import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityId, ICurrentUser } from '@shared/domain';
import { AccountService } from '../../account/services/account.service';
import { AccountDto } from '../../account/services/dto';

@Injectable()
export class AuthenticationService {
	constructor(private jwtService: JwtService, private accountService: AccountService) {}

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
}
