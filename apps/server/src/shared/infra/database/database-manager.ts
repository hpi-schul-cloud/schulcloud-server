import { EntityName, FilterQuery, FindOptions } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
// TODO: check why we have mix of both of them
import { Injectable } from '@nestjs/common';
import { BaseDO2, BaseEntityWithTimestamps, Counted, EntityId } from '@shared/domain';

@Injectable()
export class DataBaseManager<Entity extends BaseEntityWithTimestamps> {
	// DomainObject extends BaseDO2,
	constructor(public readonly em: EntityManager) {}

	public async remove(entities: Entity[]): Promise<void> {
		await this.em.removeAndFlush(entities);
	}
	/*
	private assignOrCreate<S>(EntityClass: { new (props: S): EntityType }, domainObject: BaseDO2<Props>) {
		const existing = this.em.getUnitOfWork().getById<EntityType>(EntityClass.name, domainObject.id);
		if (existing) {
			// const { createdAt } = existing;
			const props = domainObject.getProps();
			this.em.assign(existing, props);
		} else {
			this.em.create(EntityClass, domainObject, { managed: true, persist: true });
		}
	}
	*/
	/*
	public getFromUnitOfWorkById(constructor: EntityName<Entity>, id: EntityId) {
		const existing = this.em.getUnitOfWork().getById(constructor, id);
	}
	*/

	// TODO: check if it is work?
	public async persist(entities: Entity[]): Promise<void> {
		await this.em.persistAndFlush(entities);
	}

	public async find(
		constructor: EntityName<Entity>,
		query: FilterQuery<Entity>,
		options?: FindOptions<Entity>
	): Promise<Entity[]> {
		const entities = await this.em.find<Entity>(constructor, query, options);

		return entities;
	}

	public async findAndCount(
		constructor: EntityName<Entity>,
		query: FilterQuery<Entity>,
		options?: FindOptions<Entity>
	): Promise<Counted<Entity[]>> {
		const [fileRecordEntities, count] = await this.em.findAndCount<Entity>(constructor, query, options);

		return [fileRecordEntities, count];
	}

	public async findOne(
		constructor: EntityName<Entity>,
		query: FilterQuery<Entity>,
		options?: FindOptions<Entity>
	): Promise<Entity> {
		const entity = await this.em.findOneOrFail<Entity>(constructor, query, options);

		return entity;
	}
}
