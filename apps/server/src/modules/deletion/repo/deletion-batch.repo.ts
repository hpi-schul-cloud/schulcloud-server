import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DeletionBatchEntity } from './entity/deletion-batch.entity';
import { DeletionBatch } from '../domain/do';
import { DeletionBatchMapper } from './mapper/deletion-batch.mapper';

// TODO: repo tests are missing
@Injectable()
export class DeletionBatchRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return DeletionBatchEntity;
	}

	async create(deletionBatch: DeletionBatch): Promise<void> {
		const entity = DeletionBatchMapper.mapToEntity(deletionBatch);
		this.em.persist(entity);
		await this.em.flush();
	}

	async findById(batchId: EntityId): Promise<DeletionBatch> {
		const entity = await this.em.findOneOrFail(DeletionBatchEntity, {
			id: batchId,
		});

		return DeletionBatchMapper.mapToDO(entity);
	}

	async findAndCount(
		where = {},
		options: { limit?: number; offset?: number } = {}
	): Promise<[DeletionBatch[], number]> {
		const [entities, count] = await this.em.findAndCount(DeletionBatchEntity, where, {
			limit: options.limit,
			offset: options.offset,
			orderBy: { createdAt: 'DESC' },
		});

		const batches = entities.map((entity) => DeletionBatchMapper.mapToDO(entity));
		return [batches, count];
	}

	async findByDeletionRequestId(deletionRequestId: EntityId): Promise<DeletionBatch[]> {
		const entities = await this.em.find(DeletionBatchEntity, {
			deletionRequestIds: { $in: [deletionRequestId] },
		});

		return entities.map((entity) => DeletionBatchMapper.mapToDO(entity));
	}

	async deleteById(batchId: EntityId): Promise<void> {
		const entity = await this.em.findOneOrFail(DeletionBatchEntity, {
			id: batchId,
		});

		await this.em.removeAndFlush(entity);
	}
}