import { EntityName, FilterQuery, FindOptions } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
// TODO: check why we have mix of both of them
import { Injectable } from '@nestjs/common';
import { BaseEntity, Counted } from '@shared/domain';

@Injectable()
export class DataBaseManager {
	constructor(private readonly em: EntityManager) {}

	public async remove(entities: BaseEntity[]): Promise<void> {
		await this.em.removeAndFlush(entities);
	}

	// TODO: check if it is work?
	public async persist(entities: BaseEntity[]): Promise<void> {
		await this.em.persistAndFlush(entities);
	}

	public async find<T extends BaseEntity>(
		constructor: EntityName<T>,
		query: FilterQuery<T>,
		options?: FindOptions<T>
	): Promise<T[]> {
		const entities = await this.em.find<T>(constructor, query, options);

		return entities;
	}

	public async findAndCount<T extends BaseEntity>(
		constructor: EntityName<T>,
		query: FilterQuery<T>,
		options?: FindOptions<T>
	): Promise<Counted<T[]>> {
		const [fileRecordEntities, count] = await this.em.findAndCount<T>(constructor, query, options);

		return [fileRecordEntities, count];
	}

	public async findOne<T extends BaseEntity>(
		constructor: EntityName<T>,
		query: FilterQuery<T>,
		options?: FindOptions<T>
	): Promise<T> {
		const entity = await this.em.findOneOrFail<T>(constructor, query, options);

		return entity;
	}
}
