import { EntityData, EntityName, FilterQuery, wrap } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDO, BaseEntity, baseEntityProperties, EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export abstract class BaseDORepo<DO extends BaseDO, E extends BaseEntity, P> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {}

	abstract get entityName(): EntityName<E>;

	abstract entityFactory(props: P): E;

	protected abstract mapEntityToDO(entity: E): DO;

	protected abstract mapDOToEntityProperties(entityDO: DO): P;

	protected entityData(entity: E): EntityData<E> {
		return wrap(entity).toPOJO() as EntityData<E>;
	}

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
		this.logger.debug(`Created new entity with id ${created.id}`);
		return created;
	}

	private async updateEntity(domainObject: DO): Promise<E> {
		const newEntity: E = this.createNewEntityFromDO(domainObject);

		const fetchedEntity: E = await this._em.findOneOrFail(this.entityName, {
			id: domainObject.id,
		} as FilterQuery<E>);

		const newEntityData = this.entityData(newEntity);
		this.removeProtectedEntityFields(newEntityData);

		const updated: E = this._em.assign(fetchedEntity, newEntityData, { updateByPrimaryKey: false });
		this.logger.debug(`Updated entity with id ${updated.id}`);
		return updated;
	}

	protected createNewEntityFromDO(domainObject: DO) {
		const entityProps: P = this.mapDOToEntityProperties(domainObject);
		const newEntity: E = this.entityFactory(entityProps);

		if (domainObject.id) {
			newEntity.id = domainObject.id;
			newEntity._id = new ObjectId(domainObject.id);
		}
		return newEntity;
	}

	/**
	 * Ignore base entity properties when updating entity
	 */
	private removeProtectedEntityFields(entity: EntityData<E>) {
		Object.keys(entity).forEach((key) => {
			if (baseEntityProperties.includes(key)) {
				delete entity[key];
			}
		});
	}

	async delete(domainObjects: DO[] | DO): Promise<void> {
		const dos: DO[] = Array.isArray(domainObjects) ? domainObjects : [domainObjects];

		const entities: E[] = dos.map((domainObj: DO): E => this.createNewEntityFromDO(domainObj));

		this._em.remove(entities);
		await this._em.flush();
	}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/ARC-173 replace with delete(domainObject: DO)
	/**
	 * @deprecated Please use {@link delete} instead
	 */
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
