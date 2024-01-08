import { AccountEntity } from '../../entity';
import { Counted } from '@shared/domain/types';
import { Account } from '../../domain/account';

export class AccountEntityToDoMapper {
	static mapToDo(account: AccountEntity): Account {
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
		const accountDos: Account[] = AccountEntityToDoMapper.mapAccountsToDo(foundAccounts);
		return [accountDos, accountEntities[1]];
	}

	static mapAccountsToDo(accounts: AccountEntity[]): Account[] {
		return accounts.map((accountEntity) => AccountEntityToDoMapper.mapToDo(accountEntity));
	}
}
