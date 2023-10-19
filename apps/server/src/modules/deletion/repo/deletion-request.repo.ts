import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionRequestEntity } from '../entities';
import { DeletionRequestMapper } from './mapper/deletion-request.mapper';

@Injectable()
export class DeletionRequestRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, { id });

		const mapped: DeletionRequest = DeletionRequestMapper.mapToDO(deletionRequest);

		return mapped;
	}

	// create
	async create(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		await this.em.persistAndFlush(deletionRequestEntity);
	}

	// update
	async update(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		await this.em.persistAndFlush(deletionRequestEntity);
	}

	// find
	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		const currentDate = new Date();
		const itemsToDelete: DeletionRequestEntity[] = await this.em.find(DeletionRequestEntity, {
			deleteAfter: { $lt: currentDate },
		});

		const mapped: DeletionRequest[] = itemsToDelete.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	// delete
}
