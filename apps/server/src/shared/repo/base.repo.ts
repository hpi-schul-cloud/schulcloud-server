import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

/**
 * @deprecated This repo is do not use it for new repos. Please use {@link BaseDORepo}
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
