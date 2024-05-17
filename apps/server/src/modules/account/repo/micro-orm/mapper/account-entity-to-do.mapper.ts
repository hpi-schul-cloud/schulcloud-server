import { Counted } from '@shared/domain/types';
import { Account } from '../../../domain/account';
import { AccountEntity } from '../../../domain/entity/account.entity';

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
			deactivatedAt: account.deactivatedAt,
		});
	}

	static mapCountedEntities(accountEntities: Counted<AccountEntity[]>): Counted<Account[]> {
		const foundAccounts = accountEntities[0];
		const accountDtos: Account[] = AccountEntityToDoMapper.mapEntitiesToDos(foundAccounts);
		return [accountDtos, accountEntities[1]];
	}

	static mapEntitiesToDos(accounts: AccountEntity[]): Account[] {
		return accounts.map((accountEntity) => AccountEntityToDoMapper.mapToDo(accountEntity));
	}
}
