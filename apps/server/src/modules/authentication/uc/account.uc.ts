import { Injectable } from '@nestjs/common';
import { Account, EntityId } from '@shared/domain';
import { AccountRepo } from '@shared/repo/account';

@Injectable()
export class AccountUc {
	constructor(private readonly accountRepo: AccountRepo) {}

	findOneById(accountId: EntityId): Promise<Account> {
		return this.accountRepo.read(accountId);
	}

	create(account: Account): Promise<Account> {
		return this.accountRepo.create(account);
	}

	update(account: Account): Promise<Account> {
		return this.accountRepo.update(account);
	}

	remove(accountId: EntityId): Promise<Account> {
		return this.accountRepo.delete(accountId);
	}
}
