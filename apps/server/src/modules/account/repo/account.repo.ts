import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Account } from '@shared/domain/entity/account.entity';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	get entityName() {
		return Account;
	}

	/**
	 * Finds an account by user id.
	 * @param userId the user id
	 */
	async findByUserId(userId: EntityId | ObjectId): Promise<Account | null> {
		return this._em.findOne(Account, { userId: new ObjectId(userId) });
	}

	async findMultipleByUserId(userIds: EntityId[] | ObjectId[]): Promise<Account[]> {
		const objectIds = userIds.map((id: EntityId | ObjectId) => new ObjectId(id));
		return this._em.find(Account, { userId: objectIds });
	}

	async findByUserIdOrFail(userId: EntityId | ObjectId): Promise<Account> {
		return this._em.findOneOrFail(Account, { userId: new ObjectId(userId) });
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		return this._em.findOne(Account, { username, systemId: new ObjectId(systemId) });
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

	async deleteById(accountId: EntityId | ObjectId): Promise<void> {
		const account = await this.findById(accountId);
		return this.delete(account);
	}

	async deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		const account = await this.findByUserId(userId);
		if (account === null) {
			return [];
		}
		await this._em.removeAndFlush(account);

		return [account.id];
	}

	/**
	 * @deprecated For migration purpose only
	 */
	async findMany(offset = 0, limit = 100): Promise<Account[]> {
		const result = await this._em.find(this.entityName, {}, { offset, limit, orderBy: { _id: SortOrder.asc } });
		this._em.clear();
		return result;
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
