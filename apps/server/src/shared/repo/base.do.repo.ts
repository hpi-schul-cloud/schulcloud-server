import { EntityData, EntityName, FilterQuery, Primary, RequiredEntityData, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseDO } from '@shared/domain/domainobject';
import { BaseEntity, baseEntityProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export abstract class BaseDORepo<DO extends BaseDO, E extends BaseEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {}

	abstract get entityName(): EntityName<E>;

	protected abstract mapEntityToDO(entity: E): DO;

	protected abstract mapDOToEntityProperties(entityDO: DO): EntityData<E>;

	async save(domainObject: DO): Promise<DO> {
		const savedDomainObjects = await this.saveAll([domainObject]);
		return savedDomainObjects[0];
	}

	async saveAll(domainObjects: DO[]): Promise<DO[]> {
		const promises = domainObjects.map(async (dob) => this.createOrUpdateEntity(dob));

		const savedDomainObjects = await Promise.all(promises);

		return savedDomainObjects;
	}

	private async createOrUpdateEntity(domainObject: DO): Promise<DO> {
		const entityData = this.mapDOToEntityProperties(domainObject);
		this.removeProtectedEntityFields(entityData);

		const { entityName } = this;

		const existingEntity = domainObject.id
			? await this._em.findOneOrFail(entityName, { id: domainObject.id } as FilterQuery<E>)
			: undefined;

		const persistedEntity = existingEntity
			? this._em.assign(existingEntity, entityData)
			: this._em.create(entityName, entityData as RequiredEntityData<E>);

		await this._em.flush();

		if (!domainObject.id) {
			domainObject.id = persistedEntity.id;
		}
		if ('createdAt' in domainObject && 'createdAt' in persistedEntity) {
			domainObject.createdAt = persistedEntity.createdAt;
		}
		if ('updatedAt' in domainObject && 'updatedAt' in persistedEntity) {
			domainObject.updatedAt = persistedEntity.updatedAt;
		}

		return domainObject;
	}

	async delete(domainObjects: DO[] | DO): Promise<void> {
		const ids: Primary<E>[] = Utils.asArray(domainObjects).map((dob) => {
			if (!dob.id) {
				throw new InternalServerErrorException('Cannot delete object without id');
			}
			return dob.id as Primary<E>;
		});

		const entities = ids.map((eid) => this._em.getReference(this.entityName, eid));

		await this._em.remove(entities).flush();
	}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/ARC-173 replace with delete(domainObject: DO)
	/**
	 * @deprecated Please use {@link delete} instead
	 */
	async deleteById(id: EntityId | EntityId[]): Promise<number> {
		const ids = Utils.asArray(id) as Primary<E>[];

		const entities = ids.map((eid) => this._em.getReference(this.entityName, eid));

		await this._em.remove(entities).flush();

		const total = ids.length;

		return total;
	}

	async findById(id: EntityId): Promise<DO> {
		const entity: E = await this._em.findOneOrFail(this.entityName, { id } as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}

	/**
	 * Ignore base entity properties when updating entity
	 */
	private removeProtectedEntityFields(entityData: EntityData<E>) {
		Object.keys(entityData).forEach((key) => {
			if (baseEntityProperties.includes(key)) {
				delete entityData[key];
			}
		});
	}
}
