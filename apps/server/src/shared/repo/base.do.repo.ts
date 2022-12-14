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

	protected abstract mapEntityToDO(entity: E): DO;

	protected abstract mapDOToEntityProperties(entityDO: DO): EntityProperties<P>;

	async save(entityDo: DO): Promise<DO> {
		const savedDos: DO[] = await this.saveAll([entityDo]);
		return savedDos[0];
	}

	async saveAll(entityDos: DO[]): Promise<DO[]> {
		const promises: Promise<E>[] = entityDos.map(async (domainObject: DO): Promise<E> => {
			let entity: E;
			if (!domainObject.id) {
				entity = this.createEntity(domainObject);
			} else {
				entity = await this.updateEntity(domainObject);
			}
			return entity;
		});

		const entities: E[] = await Promise.all(promises);
		await this._em.persistAndFlush(entities);

		const savedDos: DO[] = entities.map((entity) => this.mapEntityToDO(entity));
		return savedDos;
	}

	private createEntity(domainObject: DO): E {
		const newEntity: E = this.createNewEntityFromDO(domainObject);

		const created: E = this._em.create(this.entityName, newEntity);
		// this.logger.debug(`Created new entity with id ${created.id}`);
		return created;
	}

	private async updateEntity(domainObject: DO): Promise<E> {
		const newEntity: E = this.createNewEntityFromDO(domainObject);

		this.removeProtectedEntityFields(newEntity);

		const fetchedEntity: E = await this._em.findOneOrFail(this.entityName, {
			id: domainObject.id,
		} as FilterQuery<E>);
		const updated: E = this._em.assign(fetchedEntity, newEntity);
		// this.logger.debug(`Updated entity with id ${updated.id}`);
		return updated;
	}

	private createNewEntityFromDO(domainObject: DO) {
		const entityProps: EntityProperties<P> = this.mapDOToEntityProperties(domainObject);
		const newEntity: E = this.entityFactory(entityProps);
		return newEntity;
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

	async deleteById(id: EntityId | EntityId[]): Promise<number> {
		const ids: string[] = Array.isArray(id) ? id : [id];

		let total = 0;
		const promises: Promise<void>[] = ids.map(async (entityId: string): Promise<void> => {
			const deleted: number = await this.deleteEntityById(entityId);
			total += deleted;
		});

		await Promise.all(promises);
		return total;
	}

	private deleteEntityById(id: EntityId): Promise<number> {
		const promise: Promise<number> = this._em.nativeDelete(this.entityName, { id } as FilterQuery<E>);
		return promise;
	}

	async findById(id: EntityId): Promise<DO> {
		const entity: E = await this._em.findOneOrFail(this.entityName, { id } as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}
}
