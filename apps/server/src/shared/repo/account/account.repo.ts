import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	protected get entityName() {
		return Account;
	}

	async findByUserId(userId: EntityId): Promise<Account> {
		const account = await this.findOne({ user: userId });
		return account;
	}

	async findOneByUser(user: User): Promise<Account> {
		return this.findByUserId(user.id);
	}
}
