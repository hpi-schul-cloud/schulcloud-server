import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionRequestEntity } from '../entity';
import { DeletionRequestMapper } from './mapper/deletion-request.mapper';

@Injectable()
export class DeletionRequestRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return DeletionRequestEntity;
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		const mapped: DeletionRequest = DeletionRequestMapper.mapToDO(deletionRequest);

		return mapped;
	}

	async create(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		this.em.persist(deletionRequestEntity);
		await this.em.flush();
	}

	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		const currentDate = new Date();
		const itemsToDelete: DeletionRequestEntity[] = await this.em.find(DeletionRequestEntity, {
			deleteAfter: { $lt: currentDate },
		});

		const mapped: DeletionRequest[] = itemsToDelete.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	async update(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		const referencedEntity = this.em.getReference(DeletionRequestEntity, deletionRequestEntity.id);

		await this.em.persistAndFlush(referencedEntity);
	}

	async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.executed();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	async deleteById(deletionRequestId: EntityId): Promise<boolean> {
		const entity: DeletionRequestEntity | null = await this.em.findOne(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		if (!entity) {
			return false;
		}

		await this.em.removeAndFlush(entity);

		return true;
	}
}
