import { Counted } from '@shared/domain/types';
import { Account } from '../../domain';
import { AccountEntity } from '../account.entity';

export class AccountEntityToDoMapper {
	public static mapToDo(account: AccountEntity): Account {
		return new Account({
			id: account.id,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			userId: account.userId?.toString(),
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lastLogin: account.lastLogin,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			password: account.password,
			systemId: account.systemId?.toString(),
			token: account.token,
			deactivatedAt: account.deactivatedAt,
		});
	}

	public static mapCountedEntities(accountEntities: Counted<AccountEntity[]>): Counted<Account[]> {
		const foundAccounts = accountEntities[0];
		const accountDtos: Account[] = AccountEntityToDoMapper.mapEntitiesToDos(foundAccounts);
		return [accountDtos, accountEntities[1]];
	}

	public static mapEntitiesToDos(accounts: AccountEntity[]): Account[] {
		return accounts.map((accountEntity) => AccountEntityToDoMapper.mapToDo(accountEntity));
	}
}
