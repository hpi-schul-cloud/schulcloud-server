import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestRepo } from '../repo/deletion-request.repo';
import { DeletionRequest } from '../domain/deletion-request.do';

@Injectable()
export class DeletionRequestService {
	constructor(private readonly deletionRequestRepo: DeletionRequestRepo) {}

	async createDeletionRequest(userId: EntityId): Promise<void> {
		const newDeletionRequest = new DeletionRequest({
			id: new ObjectId().toHexString(),
			source: 'shd',
			deleteAfter: new Date(),
			userId,
		});

		await this.deletionRequestRepo.create(newDeletionRequest);
	}

	// updateService
	async updateDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		await this.deletionRequestRepo.update(deletionRequest);
	}

	// findAll
	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsByDeletionDate();
		return itemsToDelete;
	}
}
