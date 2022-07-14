import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, EntityId } from '@shared/domain';

/**
 * This repo is deprecated do not use it for new repos.
 */
@Injectable()
export abstract class BaseDORepo<T extends BaseDO, E extends BaseEntity> {
	constructor(protected readonly _em: EntityManager) {}

	abstract get entityName(): EntityName<E>;

	create(entityDO: T): T {
		const entity: E = this.mapDOToEntity(entityDO);
		return this.mapEntityToDO(this._em.create(this.entityName, entity));
	}

	async save(entityDos: T | T[]): Promise<void> {
		const entities: E | E[] = Array.isArray(entityDos)
			? entityDos.map((d) => this.mapDOToEntity(d))
			: this.mapDOToEntity(entityDos);
		await this._em.persistAndFlush(entities);
	}

	async delete(entityDos: T | T[]): Promise<void> {
		const entities: E | E[] = Array.isArray(entityDos)
			? entityDos.map((d) => this.mapDOToEntity(d))
			: this.mapDOToEntity(entityDos);
		await this._em.removeAndFlush(entities);
	}

	async findById(id: EntityId): Promise<T> {
		const entity: E = await this._em.findOneOrFail(this.entityName, id as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}

	protected abstract mapDOToEntity(T): E;
	protected abstract mapEntityToDO(E): T;
}
