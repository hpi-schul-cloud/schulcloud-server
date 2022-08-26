import { EntityName, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, baseEntityProperties, EntityId, IBaseEntityProps } from '@shared/domain';
import { Logger } from '@src/core/logger';

export type EntityProperties<P> = P & IBaseEntityProps;

@Injectable()
export abstract class BaseDORepo<T extends BaseDO, E extends BaseEntity, P> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: Logger) {}

	/**
	 * Returns the name of the entity.
	 */
	abstract get entityName(): EntityName<E>;

	/**
	 * Returns a constructor for the entity.
	 */
	abstract getConstructor(): new (I) => E;

	/**
	 * Maps a domain object to its related entity properties.
	 * @param entityDO The domain object
	 * @returns The mapped entity properties
	 * @protected
	 */
	protected abstract mapDOToEntity(entityDO: T): EntityProperties<P>;

	/**
	 * Maps a database entity to a domain object.
	 * @param entity The database entity
	 * @returns The domain object
	 * @protected
	 */
	protected abstract mapEntityToDO(entity: E): T;

	/**
	 * Maps a domain object to its related entity properties.
	 * @param entityDO The domain object
	 * @returns The mapped entity properties with id
	 * @protected
	 */
	protected mapDOToEntityWithId(entityDO: T): EntityProperties<P> {
		const entityProps: EntityProperties<P> = this.mapDOToEntity(entityDO);
		entityProps.id = entityDO.id;
		return entityProps;
	}

	/**
	 * Uses the database entity constructor to create a new entity.
	 * @param Type The constructor method for the entity
	 * @param props The entity properties that are used to call the constructor
	 * @returns A newly constructed database entity
	 * @protected
	 */
	protected entityFactory(Type: new (I) => E, props: P): E {
		return new Type(props);
	}

	async save(entityDOs: T): Promise<T>;
	async save(entityDOs: T[]): Promise<T[]>;
	async save(entityDOs: T | T[]): Promise<T | T[]>;

	/**
	 * Saves one or more domain objects to the database.
	 * @param entityDOs The domain objects to save
	 * @returns The saved domain objects
	 */
	async save(entityDOs: T | T[]): Promise<T | T[]> {
		const isArray = Array.isArray(entityDOs);
		const dos: T[] = isArray ? entityDOs : [entityDOs];

		const entities: E[] = await Promise.all(
			dos.map(async (domainObject: T): Promise<E> => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(domainObject);
				const newEntity: E = this.entityFactory(this.getConstructor(), entityProps);

				const entity: E = await this._em
					.findOne(this.entityName, domainObject.id as FilterQuery<E>)
					.then((fetchedEntity: E | null): E => {
						// Create
						if (!fetchedEntity) {
							const created: E = this._em.create(this.entityName, newEntity);
							this.logger.debug(`Created new entity with id ${created.id}`);
							return created;
						}
						// Update
						// Ignore base entity properties when updating entity
						Object.keys(newEntity).forEach((key) => {
							if (baseEntityProperties.includes(key)) {
								delete newEntity[key];
							}
						});

						const updated: E = this._em.assign(fetchedEntity, newEntity);
						this.logger.debug(`Updated entity with id ${updated.id}`);
						return updated;
					});

				return entity;
			})
		);

		await this._em.persistAndFlush(entities);

		return isArray ? entities.map((entity) => this.mapEntityToDO(entity)) : this.mapEntityToDO(entities[0]);
	}

	/**
	 * Deletes one or more entities in the database.
	 * @param entityDOs The domain objects with an id related to the entities that should be deleted
	 */
	async delete(entityDOs: T | T[]): Promise<number[]> {
		const dos: T[] = Array.isArray(entityDOs) ? entityDOs : [entityDOs];

		return Promise.all(
			dos.map(async (domainObject: T): Promise<number> => {
				const entityProps: EntityProperties<P> = this.mapDOToEntityWithId(domainObject);
				return this._em.nativeDelete(this.entityName, entityProps.id as FilterQuery<E>);
			})
		);
	}

	/**
	 * Finds one entity from the database.
	 * @param id The id of the entity
	 * @returns The domain object related to the entity
	 */
	async findById(id: EntityId): Promise<T> {
		const entity: E = await this._em.findOneOrFail(this.entityName, id as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}
}
