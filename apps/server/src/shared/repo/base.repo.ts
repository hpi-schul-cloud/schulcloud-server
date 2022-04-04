import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityName, FilterQuery, FindOptions } from '@mikro-orm/core';
import { BaseEntity, EntityId } from '@shared/domain';

/**
 * This repo is deprecated do not use it for new repos.
 */
@Injectable()
export abstract class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly _em: EntityManager) {}

	protected abstract get entityName(): EntityName<T>;

	async save(entities: T[]): Promise<void> {
		await this._em.persistAndFlush(entities);
	}

	async delete(entities: T[]): Promise<void> {
		await this._em.removeAndFlush(entities);
	}

	async findOneById(id: EntityId): Promise<T> {
		const entity = await this._em.findOneOrFail(this.entityName, id as FilterQuery<T>);

		return entity;
	}

	async findOne(query: FilterQuery<T>): Promise<T | null> {
		const entity = await this._em.findOne(this.entityName, query);

		return entity;
	}

	async findOneOrFail(query: FilterQuery<T>): Promise<T> {
		const entity = await this._em.findOneOrFail(this.entityName, query);

		return entity;
	}

	async findAndCount(query: FilterQuery<T>, options?: FindOptions<T>): Promise<[T[], number]> {
		const [entities, count] = await this._em.findAndCount(this.entityName, query, options);

		return [entities, count];
	}

	async populate(entities: T[], keys: string[]) {
		await this._em.populate(entities, keys as never[]);
	}
}
