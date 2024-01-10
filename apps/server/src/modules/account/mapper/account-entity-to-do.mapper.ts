import { AccountEntity } from '@shared/domain/entity';
import { Counted } from '@shared/domain/types';
import { Account } from '../domain/account';

export class AccountEntityToDoMapper {
	static mapToDto(account: AccountEntity): Account {
		return new Account({
			id: account.id,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			userId: account.userId?.toString(),
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			password: account.password,
			systemId: account.systemId?.toString(),
			token: account.token,
		});
	}

	static mapSearchResult(accountEntities: Counted<AccountEntity[]>): Counted<Account[]> {
		const foundAccounts = accountEntities[0];
		const accountDtos: Account[] = AccountEntityToDoMapper.mapAccountsToDto(foundAccounts);
		return [accountDtos, accountEntities[1]];
	}

	static mapAccountsToDto(accounts: AccountEntity[]): Account[] {
		return accounts.map((accountEntity) => AccountEntityToDoMapper.mapToDto(accountEntity));
	}
}
