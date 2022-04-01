import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { AnyEntity, EntityName, Primary, FilterQuery } from '@mikro-orm/core';
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

	persist(entity: T): T {
		this._em.persist(entity);
		return entity;
	}

	async persistAndFlush(entity: T): Promise<T> {
		await this._em.persistAndFlush(entity);
		return entity;
	}

	async flush(): Promise<void> {
		await this._em.flush();
	}

	getObjectReference<Entity extends AnyEntity<Entity>>(
		entityName: EntityName<Entity>,
		id: Primary<Entity> | Primary<Entity>[]
	): Entity {
		return this._em.getReference(entityName, id);
	}
}
