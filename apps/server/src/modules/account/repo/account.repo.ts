import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { AccountEntity } from '@shared/domain/entity/account.entity';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';

@Injectable()
export class AccountRepo extends BaseRepo<AccountEntity> {
	get entityName() {
		return AccountEntity;
	}

	/**
	 * Finds an account by user id.
	 * @param userId the user id
	 */
	// TODO: here only EntityIds should arrive => hard to determine because this is used by feathers/js part
	async findByUserId(userId: EntityId | ObjectId): Promise<AccountEntity | null> {
		// TODO: you can use userId directly, without constructing an objectId => AccountEntity still uses ObjectId
		return this._em.findOne(AccountEntity, { userId: new ObjectId(userId) });
	}

	async findMultipleByUserId(userIds: EntityId[] | ObjectId[]): Promise<AccountEntity[]> {
		const objectIds = userIds.map((id: EntityId | ObjectId) => new ObjectId(id));
		return this._em.find(AccountEntity, { userId: objectIds });
	}

	async findByUserIdOrFail(userId: EntityId | ObjectId): Promise<AccountEntity> {
		return this._em.findOneOrFail(AccountEntity, { userId: new ObjectId(userId) });
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountEntity | null> {
		return this._em.findOne(AccountEntity, { username, systemId: new ObjectId(systemId) });
	}

	getObjectReference<Entity extends AnyEntity<Entity>>(
		entityName: EntityName<Entity>,
		id: Primary<Entity> | Primary<Entity>[]
	): Entity {
		return this._em.getReference(entityName, id);
	}

	saveWithoutFlush(account: AccountEntity): void {
		this._em.persist(account);
	}

	async flush(): Promise<void> {
		await this._em.flush();
	}

	async searchByUsernameExactMatch(username: string, skip = 0, limit = 1): Promise<Counted<AccountEntity[]>> {
		return this.searchByUsername(username, skip, limit, true);
	}

	async searchByUsernamePartialMatch(username: string, skip = 0, limit = 10): Promise<Counted<AccountEntity[]>> {
		return this.searchByUsername(username, skip, limit, false);
	}

	async deleteById(accountId: EntityId | ObjectId): Promise<void> {
		const account = await this.findById(accountId);
		return this.delete(account);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const account = await this.findByUserId(userId);
		if (account) {
			await this._em.removeAndFlush(account);
		}
	}

	/**
	 * @deprecated For migration purpose only
	 */
	async findMany(offset = 0, limit = 100): Promise<AccountEntity[]> {
		const result = await this._em.find(this.entityName, {}, { offset, limit, orderBy: { _id: SortOrder.asc } });
		this._em.clear();
		return result;
	}

	private async searchByUsername(
		username: string,
		offset: number,
		limit: number,
		exactMatch: boolean
	): Promise<Counted<AccountEntity[]>> {
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
