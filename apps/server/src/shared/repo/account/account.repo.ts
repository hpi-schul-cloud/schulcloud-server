import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';

@Injectable()
export class AccountRepo {
	constructor(private readonly em: EntityManager) {}

	async findOne(accountId: EntityId): Promise<Account> {
		const account = await this.em.findOneOrFail(Account, { id: accountId });

		return account;
	}

	create() {
		// TODO
		throw new Error('Not implemented');
	}

	update() {
		// TODO
		throw new Error('Not implemented');
	}

	patch() {
		// TODO
		throw new Error('Not implemented');
	}

	remove() {
		// TODO
		throw new Error('Not implemented');
	}
}
