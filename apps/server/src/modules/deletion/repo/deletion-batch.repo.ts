import { QueryOrder, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { DeletionBatch } from '../domain/do';
import { DeletionBatchEntity } from './entity/deletion-batch.entity';
import { DeletionBatchDomainMapper } from './mapper/deletion-batch-domain.mapper';
import { BatchStatus } from '../domain/types';

// TODO: repo tests are missing
@Injectable()
export class DeletionBatchRepo {
	constructor(private readonly em: EntityManager) {}

	public async findDeletionBatches(findOptions: IFindOptions<DeletionBatch>): Promise<Page<DeletionBatch>> {
		const where = {};

		const options = {
			offset: findOptions?.pagination?.skip,
			limit: findOptions?.pagination?.limit,
			orderBy: { createdAt: QueryOrder.DESC },
		};

		const [entities, total] = await this.em.findAndCount(DeletionBatchEntity, where, options);

		const domainObjects: DeletionBatch[] = entities.map((entity) => DeletionBatchDomainMapper.mapEntityToDo(entity));

		const page = new Page<DeletionBatch>(domainObjects, total);

		return page;
	}

	public async findById(id: EntityId): Promise<DeletionBatch> {
		const entity = await this.em.findOneOrFail(DeletionBatchEntity, id);
		const domainobject = DeletionBatchDomainMapper.mapEntityToDo(entity);

		return domainobject;
	}

	public async save(deletionBatch: DeletionBatch | DeletionBatch[]): Promise<void> {
		const deletionBatches = Utils.asArray(deletionBatch);

		deletionBatches.forEach((db) => {
			const entity = DeletionBatchDomainMapper.mapDoToEntity(db);
			this.em.persist(entity);
		});

		await this.em.flush();
	}

	public async delete(deletionBatch: DeletionBatch | DeletionBatch[]): Promise<void> {
		const deletionBatches = Utils.asArray(deletionBatch);

		deletionBatches.forEach((r) => {
			const entity = DeletionBatchDomainMapper.mapDoToEntity(r);
			this.em.remove(entity);
		});

		await this.em.flush();
	}

	public async updateStatus(deletionBatch: DeletionBatch, status: BatchStatus): Promise<void> {
		const entity = DeletionBatchDomainMapper.mapDoToEntity(deletionBatch);
		entity.status = status;
		this.em.persist(entity);
		await this.em.flush();
	}
}
