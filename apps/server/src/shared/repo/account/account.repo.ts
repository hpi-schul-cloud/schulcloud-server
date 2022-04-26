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
		return this._em.findOneOrFail(Account, { user: userId });
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

	async searchByUsernameExactMatch(username: string, skip = 0, limit = 1): Promise<[Account[], number]> {
		return this.searchByUsername(username, skip, limit, true);
	}

	async searchByUsernamePartialMatch(username: string, skip = 0, limit = 10): Promise<[Account[], number]> {
		return this.searchByUsername(username, skip, limit, false);
	}

	private async searchByUsername(
		username: string,
		offset: number,
		limit: number,
		exactMatch: boolean
	): Promise<[Account[], number]> {
		// escapes every character, that's not a unicode letter or number
		const escapedUsername = username.replace(/[^(\p{L}\p{N})]/gu, '\\$&');
		const searchUsername = exactMatch ? `^${escapedUsername}$` : escapedUsername;
		return this._em.findAndCount(
			this.entityName,
			{
				// NOTE: The default behavior of the MongoDB driver allows
				// to pass regular expressions directly into the where clause
				// without the need of using the $re operator, this will NOT
				// work with SQL drivers
				username: new RegExp(searchUsername, 'i'),
			},
			{
				offset,
				limit,
				orderBy: { username: 1 },
			}
		);
	}
}
