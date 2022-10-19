import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, baseEntityProperties, EntityId, IBaseEntityProps } from '@shared/domain';
import { Logger } from '@src/core/logger';

export type EntityProperties<P> = P & IBaseEntityProps;

@Injectable()
export abstract class BaseDORepo<DO extends BaseDO, E extends BaseEntity, P> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: Logger) {}

	abstract get entityName(): EntityName<E>;

	abstract entityFactory(props: P): E;

	protected abstract mapDOToEntity(entityDO: DO): EntityProperties<P>;

	protected abstract mapEntityToDO(entity: E): DO;

	protected mapDOToEntityWithId(entityDO: DO): EntityProperties<P> {
		const entityProps: EntityProperties<P> = this.mapDOToEntity(entityDO);
		entityProps.id = entityDO.id;
		return entityProps;
	}

	async save(entityDo: DO): Promise<DO> {
		const savedDos: DO[] = await this.saveAll([entityDo]);
		return savedDos[0];
	}

	async saveAll(entityDos: DO[]): Promise<DO[]> {
		const entities: E[] = await Promise.all(
			entityDos.map(async (domainObject: DO): Promise<E> => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(domainObject);
				const newEntity: E = this.entityFactory(entityProps);

				let result: E;
				if (!domainObject.id) {
					// Create
					result = this._em.create(this.entityName, newEntity);
					this.logger.debug(`Created new entity with id ${result.id}`);
				} else {
					// Update
					this.removeProtectedEntityFields(newEntity);

					const fetchedEntity: E = await this._em.findOneOrFail(this.entityName, domainObject.id as FilterQuery<E>);
					result = this._em.assign(fetchedEntity, newEntity);
					this.logger.debug(`Updated entity with id ${result.id}`);
				}
				return result;
			})
		);

		await this._em.persistAndFlush(entities);

		const savedDos: DO[] = entities.map((entity) => this.mapEntityToDO(entity));
		return savedDos;
	}

	/**
	 * Ignore base entity properties when updating entity
	 */
	private removeProtectedEntityFields(entity: E) {
		Object.keys(entity).forEach((key) => {
			if (baseEntityProperties.includes(key)) {
				delete entity[key];
			}
		});
	}

	async delete(entityDOs: DO | DO[]): Promise<number[]> {
		const dos: DO[] = Array.isArray(entityDOs) ? entityDOs : [entityDOs];

		return Promise.all(
			dos.map(async (domainObject: DO): Promise<number> => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(domainObject);
				return this._em.nativeDelete(this.entityName, entityProps.id as FilterQuery<E>);
			})
		);
	}

	async findById(id: EntityId): Promise<DO> {
		const entity: E = await this._em.findOneOrFail(this.entityName, id as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}
}
