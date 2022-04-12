import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';
import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	get entityName() {
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

	/**
	 * Finds the users with the exact usernames.
	 * Return an empty list, if no account with given username was found.
	 * @param userName The exact username.
	 */
	async findByUsername(userName: string): Promise<Account[]> {
		const account = await this.repo.find({
			// find mail case-insensitive by regex
			username: new RegExp(`^${userName.replace(/[^A-Za-z0-9_]/g, '\\$&')}$`, 'i'),
		});
		return account;
	}

	/**
	 * Searches through all accounts and will return all accounts
	 * with a partial or full match. The search is case-insensitive.
	 * @param username The regular expression.
	 */
	async searchByUsername(username: string): Promise<Account[]> {
		const accounts = await this.repo.find({
			username: new RegExp(username, 'i'),
		});
		return accounts;
	}
}
