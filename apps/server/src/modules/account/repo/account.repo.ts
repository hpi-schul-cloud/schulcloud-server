import { AnyEntity, EntityName, FilterQuery, Primary } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { AccountEntity } from '../entity/account.entity';
import { AccountDoToEntityMapper } from './mapper/account-do-to-entity.mapper';
import { Account } from '../domain/account';
import { AccountEntityToDoMapper } from './mapper';
import { AccountScope } from './account-scope';

@Injectable()
export class AccountRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return AccountEntity;
	}

	public async save(account: Account): Promise<Account> {
		const saveEntity = AccountDoToEntityMapper.mapToEntity(account);
		const existing = await this.em.findOne(AccountEntity, { id: account.id });

		let saved: AccountEntity;
		if (existing) {
			saved = this.em.assign(existing, saveEntity);
		} else {
			this.em.persist(saveEntity);
			saved = saveEntity;
		}
		await this.flush();

		return AccountEntityToDoMapper.mapToDo(saved);
	}

	public async findById(id: EntityId | ObjectId): Promise<Account> {
		const entity = await this.em.findOneOrFail(this.entityName, id as FilterQuery<AccountEntity>);

		return AccountEntityToDoMapper.mapToDo(entity);
	}

	/**
	 * Finds an account by user id.
	 * @param userId the user id
	 */
	public async findByUserId(userId: EntityId | ObjectId): Promise<Account | null> {
		const entity = await this.em.findOne(AccountEntity, { userId: new ObjectId(userId) });

		if (!entity) {
			return null;
		}

		return AccountEntityToDoMapper.mapToDo(entity);
	}

	public async findMultipleByUserId(userIds: EntityId[] | ObjectId[]): Promise<Account[]> {
		const objectIds = userIds.map((id: EntityId | ObjectId) => new ObjectId(id));
		const entities = await this.em.find(AccountEntity, { userId: objectIds });

		return AccountEntityToDoMapper.mapEntitiesToDos(entities);
	}

	public async findByUserIdOrFail(userId: EntityId | ObjectId): Promise<Account> {
		const entity = await this.em.findOneOrFail(AccountEntity, { userId: new ObjectId(userId) });

		return AccountEntityToDoMapper.mapToDo(entity);
	}

	public async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const entity = await this.em.findOne(AccountEntity, { username, systemId: new ObjectId(systemId) });

		if (!entity) {
			return null;
		}

		return AccountEntityToDoMapper.mapToDo(entity);
	}

	getObjectReference<Entity extends AnyEntity<Entity>>(
		entityName: EntityName<Entity>,
		id: Primary<Entity> | Primary<Entity>[]
	): Entity {
		return this.em.getReference(entityName, id);
	}

	public async saveWithoutFlush(account: Account): Promise<void> {
		const saveEntity = AccountDoToEntityMapper.mapToEntity(account);
		const existing = await this.em.findOne(AccountEntity, { id: account.id });

		if (existing) {
			this.em.assign(existing, saveEntity);
		} else {
			this.em.persist(saveEntity);
		}
	}

	public async flush(): Promise<void> {
		await this.em.flush();
	}

	public async searchByUsernameExactMatch(username: string, skip = 0, limit = 1): Promise<Counted<Account[]>> {
		return this.searchByUsername(username, skip, limit, true);
	}

	public async searchByUsernamePartialMatch(username: string, skip = 0, limit = 10): Promise<Counted<Account[]>> {
		return this.searchByUsername(username, skip, limit, false);
	}

	public async deleteById(accountId: EntityId | ObjectId): Promise<void> {
		const entity = await this.em.findOneOrFail(AccountEntity, { id: accountId.toString() });
		await this.em.removeAndFlush(entity);
	}

	public async deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		const entities = await this.em.find(this.entityName, { userId: new ObjectId(userId) });
		if (entities.length === 0) {
			return [];
		}
		await this.em.removeAndFlush(entities);

		return [entities[0].id];
	}

	/**
	 * @deprecated For migration purpose only
	 */
	public async findMany(offset = 0, limit = 100): Promise<Account[]> {
		const result = await this.em.find(this.entityName, {}, { offset, limit, orderBy: { _id: SortOrder.asc } });
		this.em.clear();
		return AccountEntityToDoMapper.mapEntitiesToDos(result);
	}

	async findByUserIdsAndSystemId(userIds: string[], systemId: string): Promise<string[]> {
		const scope = new AccountScope();
		const userIdScope = new AccountScope();

		userIdScope.byUserIdsAndSystemId(userIds, systemId);

		scope.addQuery(userIdScope.query);

		const foundUsers = await this.em.find(AccountEntity, scope.query);

		const result = foundUsers.filter((user) => user.userId !== undefined).map(({ userId }) => userId!.toHexString());

		return result;
	}

	private async searchByUsername(
		username: string,
		offset: number,
		limit: number,
		exactMatch: boolean
	): Promise<Counted<Account[]>> {
		const escapedUsername = username.replace(/[^(\p{L}\p{N})]/gu, '\\$&');
		const searchUsername = exactMatch ? `^${escapedUsername}$` : escapedUsername;
		const [entities, count] = await this.em.findAndCount(
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
		const accounts = AccountEntityToDoMapper.mapEntitiesToDos(entities);
		return [accounts, count];
	}
}
