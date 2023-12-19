import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { AccountEntity } from '@src/modules/account/entity/account.entity';
import { Account } from '../domain';
import { AccountEntityToDoMapper } from './mapper/account-entity-to-do.mapper';

@Injectable()
export class AccountRepo extends BaseRepo<AccountEntity> {
	get entityName() {
		return AccountEntity;
	}

	/**
	 * Finds an account by user id.
	 * @param userId the user id
	 */
	async findByUserId(userId: EntityId | ObjectId): Promise<Account | null> {
		const entity: AccountEntity | null = await this._em.findOne(AccountEntity, { userId: new ObjectId(userId) });
		if (!entity) {
			return null;
		}

		return AccountEntityToDoMapper.mapToDo(entity);
	}

	async findMultipleByUserId(userIds: EntityId[] | ObjectId[]): Promise<Account[]> {
		const objectIds = userIds.map((id: EntityId | ObjectId) => new ObjectId(id));
		const entities: AccountEntity[] = await this._em.find(AccountEntity, { userId: objectIds });
		const domainObjects = entities.map((entity) => AccountEntityToDoMapper.mapToDo(entity));

		return domainObjects;
	}

	async findByUserIdOrFail(userId: EntityId | ObjectId): Promise<Account> {
		const entity: AccountEntity = await this._em.findOneOrFail(AccountEntity, { userId: new ObjectId(userId) });
		return AccountEntityToDoMapper.mapToDo(entity);
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const entity: AccountEntity | null = await this._em.findOne(AccountEntity, {
			username,
			systemId: new ObjectId(systemId),
		});
		if (!entity) {
			return null;
		}

		return AccountEntityToDoMapper.mapToDo(entity);
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
		const result = await this._em.find(AccountEntity, {}, { offset, limit, orderBy: { _id: SortOrder.asc } });
		this._em.clear();
		return result;
	}

	private async searchByUsername(
		username: string,
		offset: number,
		limit: number,
		exactMatch: boolean
	): Promise<Counted<AccountEntity[]>> {
		// escapes every character, that's not a unicode letter or number
		const escapedUsername = username.replace(/[^(\p{L}\p{N})]/gu, '\\$&');
		const searchUsername = exactMatch ? `^${escapedUsername}$` : escapedUsername;
		return this._em.findAndCount(
			AccountEntity,
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
