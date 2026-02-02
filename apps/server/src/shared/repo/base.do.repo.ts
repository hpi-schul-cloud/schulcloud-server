import { LegacyLogger } from '@core/logger';
import {
	EntityData,
	EntityName,
	FilterQuery,
	FromEntityType,
	Primary,
	RequiredEntityData,
	Utils,
} from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseDO } from '@shared/domain/domainobject/base.do';
import { BaseEntity, baseEntityProperties } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

@Injectable()
export abstract class BaseDORepo<DO extends BaseDO, E extends BaseEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {}

	abstract get entityName(): EntityName<E>;

	protected abstract mapEntityToDO(entity: E): DO;

	protected abstract mapDOToEntityProperties(entityDO: DO): EntityData<FromEntityType<E>>;

	public async save(domainObject: DO): Promise<DO> {
		const savedDomainObjects = await this.saveAll([domainObject]);
		return savedDomainObjects[0];
	}

	public async saveAll(domainObjects: DO[]): Promise<DO[]> {
		const promises = domainObjects.map((dob) => this.createOrUpdateEntity(dob));

		const results = await Promise.all(promises);

		await this._em.flush();

		const savedDomainObjects = results.map(({ domainObject, persistedEntity }) =>
			this.remapProtectedEntityFields(domainObject, persistedEntity)
		);

		return savedDomainObjects;
	}

	private async createOrUpdateEntity(domainObject: DO): Promise<{ domainObject: DO; persistedEntity: E }> {
		const entityData: EntityData<unknown> = this.mapDOToEntityProperties(domainObject);
		this.removeProtectedEntityFields(entityData);

		const { entityName } = this;

		const existingEntity = domainObject.id
			? await this._em.findOneOrFail(entityName, { id: domainObject.id } as FilterQuery<E>)
			: undefined;

		const persistedEntity: E = existingEntity
			? (this._em.assign(existingEntity, entityData) as E)
			: this._em.create(entityName, entityData as RequiredEntityData<E>);

		return { domainObject, persistedEntity };
	}

	public async delete(domainObjects: DO[] | DO): Promise<void> {
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
	public async deleteById(id: EntityId | EntityId[]): Promise<number> {
		const ids = Utils.asArray(id) as Primary<E>[];

		const entities = ids.map((eid) => this._em.getReference(this.entityName, eid));

		await this._em.remove(entities).flush();

		const total = ids.length;

		return total;
	}

	public async findById(id: EntityId): Promise<DO> {
		const entity: E = await this._em.findOneOrFail(this.entityName, { id } as FilterQuery<E>);
		return this.mapEntityToDO(entity);
	}

	/**
	 * Ignore base entity properties when updating entity
	 */
	private removeProtectedEntityFields(entityData: EntityData<E>): void {
		Object.keys(entityData).forEach((key) => {
			if (baseEntityProperties.includes(key)) {
				delete entityData[key];
			}
		});
	}

	private remapProtectedEntityFields(domainObject: DO, persistedEntity: E): DO {
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
}
