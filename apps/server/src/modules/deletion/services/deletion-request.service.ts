import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestRepo } from '../repo/deletion-request.repo';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

@Injectable()
export class DeletionRequestService {
	constructor(private readonly deletionRequestRepo: DeletionRequestRepo) {}

	async createDeletionRequest(
		targetRefId: EntityId,
		targetRefDomain: DeletionDomainModel,
		deleteInMinutes?: number
	): Promise<{ requestId: EntityId; deletionPlannedAt: Date }> {
		deleteInMinutes = deleteInMinutes === undefined ? 43200 : deleteInMinutes;

		const dateOfDeletion = new Date();
		dateOfDeletion.setMinutes(dateOfDeletion.getMinutes() + deleteInMinutes);

		const newDeletionRequest = new DeletionRequest({
			id: new ObjectId().toHexString(),
			targetRefDomain,
			deleteAfter: dateOfDeletion,
			targetRefId,
			status: DeletionStatusModel.REGISTERED,
		});

		await this.deletionRequestRepo.create(newDeletionRequest);

		return { requestId: newDeletionRequest.id, deletionPlannedAt: newDeletionRequest.deleteAfter };
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

		return deletionRequest;
	}

	async findAllItemsByDeletionDate(): Promise<DeletionRequest[]> {
		const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsByDeletionDate();

		return itemsToDelete;
	}

	async update(deletionRequestToUpdate: DeletionRequest): Promise<void> {
		await this.deletionRequestRepo.update(deletionRequestToUpdate);
	}

	async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		return this.deletionRequestRepo.markDeletionRequestAsExecuted(deletionRequestId);
	}

	async deleteById(deletionRequestId: EntityId): Promise<void> {
		await this.deletionRequestRepo.deleteById(deletionRequestId);
	}
}
