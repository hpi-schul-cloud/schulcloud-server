import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityName, FilterQuery } from '@mikro-orm/core';
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

	async findOne(query: FilterQuery<T>): Promise<T> {
		const entity = await this._em.findOneOrFail(this.entityName, query);

		return entity;
	}

	async populate(entities: T[], keys: string[]) {
		await this._em.populate(entities, keys as never[]);
	}
}
