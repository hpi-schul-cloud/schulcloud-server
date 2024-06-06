import { EntityData, EntityName, FilterQuery, Primary, RequiredEntityData, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { BaseEntity, baseEntityProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepoInterface } from './base-domain-object.repo.interface';

@Injectable()
export abstract class BaseDomainObjectRepo<D extends DomainObject<AuthorizableObject>, E extends BaseEntity>
	implements BaseDomainObjectRepoInterface<D>
{
	constructor(protected readonly em: EntityManager) {}

	protected abstract get entityName(): EntityName<E>;

	protected abstract mapDOToEntityProperties(entityDO: D): EntityData<E>;

	async save(domainObject: D): Promise<D> {
		const savedDomainObjects = await this.saveAll([domainObject]);
		return savedDomainObjects[0];
	}

	async saveAll(domainObjects: D[]): Promise<D[]> {
		const promises = domainObjects.map((dob) => this.createOrUpdateEntity(dob));

		const results = await Promise.all(promises);

		await this.em.flush();

		return results.map((result) => result.domainObject);
	}

	private async createOrUpdateEntity(domainObject: D): Promise<{ domainObject: D; persistedEntity: E }> {
		const entityData = this.mapDOToEntityProperties(domainObject);
		this.removeProtectedEntityFields(entityData);
		const { id } = domainObject;
		const existingEntity = await this.em.findOne(this.entityName, { id } as FilterQuery<E>);

		const persistedEntity = existingEntity
			? this.em.assign(existingEntity, entityData)
			: this.em.create(this.entityName, { ...entityData, id } as RequiredEntityData<E>);

		return { domainObject, persistedEntity };
	}

	async delete(domainObjects: D[] | D): Promise<void> {
		const ids: Primary<E>[] = Utils.asArray(domainObjects).map((dob) => {
			if (!dob.id) {
				throw new InternalServerErrorException('Cannot delete object without id');
			}
			return dob.id as Primary<E>;
		});

		const entities = ids.map((eid) => this.em.getReference(this.entityName, eid));

		await this.em.remove(entities).flush();
	}

	protected async findEntityById(id: EntityId): Promise<E> {
		const entity: E = await this.em.findOneOrFail(this.entityName, { id } as FilterQuery<E>);

		return entity;
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
