import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestRepo } from '../repo/deletion-request.repo';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';

@Injectable()
export class DeletionRequestService {
	constructor(private readonly deletionRequestRepo: DeletionRequestRepo) {}

	async createDeletionRequest(
		itemId: EntityId,
		domain: DeletionDomainModel,
		deleteInMinutes?: number
	): Promise<string> {
		deleteInMinutes = deleteInMinutes === undefined ? 43200 : deleteInMinutes;

		const dateOfDeletion = new Date();
		dateOfDeletion.setDate(dateOfDeletion.getDate() + deleteInMinutes * 1000);

		const newDeletionRequest = new DeletionRequest({
			id: new ObjectId().toHexString(),
			domain,
			deleteAfter: dateOfDeletion,
			itemId,
		});

		await this.deletionRequestRepo.create(newDeletionRequest);

		return newDeletionRequest.id;
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

		return deletionRequest;
	}

	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsByDeletionDate();

		return itemsToDelete;
	}

	async deleteById(deletionRequestId: EntityId): Promise<void> {
		await this.deletionRequestRepo.deleteById(deletionRequestId);
	}
}
