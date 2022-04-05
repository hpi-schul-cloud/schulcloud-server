import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';
import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	protected get entityName() {
		return Account;
	}

	async findByUserId(userId: EntityId): Promise<Account> {
		const account = await this._em.findOneOrFail(Account, { user: userId });
		return account;
	}

	async findOneByUser(user: User): Promise<Account> {
		return this.findByUserId(user.id);
	}

	getObjectReference<Entity extends AnyEntity<Entity>>(
		entityName: EntityName<Entity>,
		id: Primary<Entity> | Primary<Entity>[]
	): Entity {
		return this._em.getReference(entityName, id);
	}

	saveWithoutFlush(account: Account): void {
		this._em.persist(account);
	}

	async flush(): Promise<void> {
		await this._em.flush();
	}
}
