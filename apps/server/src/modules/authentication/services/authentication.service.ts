import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityId, ICurrentUser } from '@shared/domain';
import { AccountService } from '../../account/services/account.service';
import { AccountDto } from '../../account/services/dto';

@Injectable()
export class AuthenticationService {
	constructor(private jwtService: JwtService, private accountService: AccountService) {}

	async loadAccount(username: string, systemId?: EntityId): Promise<AccountDto> {
		const accounts = await this.accountService.searchByUsernameExactMatch(username);
		let foundAccount: AccountDto | undefined;
		if (accounts.accounts.length === 1) {
			[foundAccount] = accounts.accounts;
		} else if (accounts.accounts.length > 1) {
			foundAccount = accounts.accounts.find((account) => account.systemId === systemId);
		}
		if (!foundAccount) {
			throw new UnauthorizedException();
		}
		return foundAccount;
	}

	// if user does not contain a systemId the JWT won't contain it, thus the user needs to change his PW during first login
	generateJwt(user: ICurrentUser) {
		return { accessToken: this.jwtService.sign({ ...user, sub: user.accountId }) };
	}
}
