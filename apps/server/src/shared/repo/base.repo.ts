import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import type { BaseEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';

/**
 * This repo will be replaced in the future by a more domain driven repo, which is currently discussed in the arc chapter.
 * An example for a possible implementation is the {@link BaseDORepo}.
 */
@Injectable()
export abstract class BaseRepo<T extends BaseEntity> {
	constructor(protected readonly _em: EntityManager) {}

	abstract get entityName(): EntityName<T>;

	public create(entity: T): T {
		return this._em.create(this.entityName, entity);
	}

	public async save(entities: T | T[]): Promise<void> {
		await this._em.persistAndFlush(entities);
	}

	public async delete(entities: T | T[]): Promise<void> {
		await this._em.removeAndFlush(entities);
	}

	public async findById(id: EntityId | ObjectId): Promise<T> {
		const entity = await this._em.findOneOrFail(this.entityName, id as FilterQuery<T>);
		return entity;
	}
}
