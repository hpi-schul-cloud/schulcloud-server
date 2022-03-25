import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain';
import { AnyEntity, EntityName, Primary } from '@mikro-orm/core';

/**
 * This repo is deprecated do not use it for new repos.
 */
@Injectable()
export class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly em: EntityManager) {}

	async save(entities: T[]): Promise<void> {
		await this.em.persistAndFlush(entities);
	}

	async delete(entities: T[]): Promise<void> {
		await this.em.removeAndFlush(entities);
	}

	persist(entity: T): T {
		this.em.persist(entity);
		return entity;
	}

	async persistAndFlush(entity: T): Promise<T> {
		await this.em.persistAndFlush(entity);
		return entity;
	}

	async flush(): Promise<void> {
		await this.em.flush();
	}

	getObjectReference<Entity extends AnyEntity<Entity>>(
		entityName: EntityName<Entity>,
		id: Primary<Entity> | Primary<Entity>[]
	): Entity {
		return this.em.getReference(entityName, id);
	}
}
