import { EntityDTO, EntityName, FilterQuery, wrap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, baseEntityProperties, EntityId, IBaseEntityProps } from '@shared/domain';
import { Logger } from '@src/core/logger';
import ArrayLike = jasmine.ArrayLike;

export type EntityProperties<P> = P & IBaseEntityProps;

@Injectable()
export abstract class BaseDORepo<T extends BaseDO, E extends BaseEntity, P> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: Logger) {}

	abstract get entityName(): EntityName<E>;

	abstract getConstructor(): new (I) => E;

	protected abstract mapDOToEntity(entityDO: T): EntityProperties<P>;
	protected abstract mapEntityToDO(entity: E): T;

	protected mapDOToEntityWithId(edo: T): EntityProperties<P> {
		const entity: EntityProperties<P> = this.mapDOToEntity(edo);
		entity.id = edo.id;
		return entity;
	}

	protected entityFactory(Type: new (I) => E, props: P): E {
		return new Type(props);
	}

	async save(entityDos: T | T[]): Promise<T | T[]> {
		const isArray = Array.isArray(entityDos);
		const dos: T[] = isArray ? entityDos : [entityDos];

		const entities: E[] = await Promise.all(
			dos.map(async (d) => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(d);
				const newEntity: E = this.entityFactory(this.getConstructor(), entityProps);

				const entity: E = await this._em
					.findOneOrFail(this.entityName, d.id as FilterQuery<E>)
					.then((fetchedEntity: E) => {
						// Ignore base entity properties when updating entity
						Object.keys(newEntity).forEach((key) => {
							if (baseEntityProperties.includes(key)) {
								delete newEntity[key];
							}
						});

						this.logger.debug(`Update entity with id ${fetchedEntity.id}`);
						return this._em.assign(fetchedEntity, newEntity);
					})
					.catch(() => {
						this.logger.debug(`Created new entity`);
						return this._em.create(this.entityName, newEntity);
					});

				return entity;
			})
		);

		await this._em.persistAndFlush(entities);

		return isArray ? entities.map((entity) => this.mapEntityToDO(entity)) : this.mapEntityToDO(entities[0]);
	}

	async delete(entityDos: T | T[]): Promise<void> {
		const dos: T[] = Array.isArray(entityDos) ? entityDos : [entityDos];

		const entities: E[] = await Promise.all(
			dos.map(async (d) => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(d);
				return this._em.findOneOrFail(this.entityName, entityProps.id as FilterQuery<E>);
			})
		);

		await this._em.removeAndFlush(entities);
	}

	async findById(id: EntityId): Promise<T> {
		const entity: E = await this._em.findOneOrFail(this.entityName, id as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}
}
