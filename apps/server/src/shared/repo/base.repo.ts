import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseEntity, EntityId } from '@shared/domain';

/**
 * This repo is deprecated do not use it for new repos.
 */
@Injectable()
export abstract class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly _em: EntityManager) {}

	abstract get entityName(): EntityName<T>;

	create(entity: T): T {
		return this._em.create(this.entityName, entity);
	}

	async save(entities: T | T[]): Promise<void> {
		await this._em.persistAndFlush(entities);
	}

	async delete(entities: T | T[]): Promise<void> {
		await this._em.removeAndFlush(entities);
	}

	async findById(id: EntityId): Promise<T> {
		const promise: Promise<T> = this._em.findOneOrFail(this.entityName, id as FilterQuery<T>);
		return promise;
	}
}
