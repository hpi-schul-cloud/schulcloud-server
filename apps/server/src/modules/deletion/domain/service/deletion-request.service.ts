import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestRepo } from '../../repo';
import { DeletionRequest } from '../do';
import { DomainName, StatusModel } from '../types';
import { DeletionConfig } from '../interface';

@Injectable()
export class DeletionRequestService {
	constructor(
		private readonly deletionRequestRepo: DeletionRequestRepo,
		private readonly configService: ConfigService<DeletionConfig, true>
	) {}

	async createDeletionRequest(
		targetRefId: EntityId,
		targetRefDomain: DomainName,
		deleteInMinutes = 43200
	): Promise<{ requestId: EntityId; deletionPlannedAt: Date }> {
		const dateOfDeletion = new Date();
		dateOfDeletion.setMinutes(dateOfDeletion.getMinutes() + deleteInMinutes);

		const newDeletionRequest = new DeletionRequest({
			id: new ObjectId().toHexString(),
			targetRefDomain,
			deleteAfter: dateOfDeletion,
			targetRefId,
			status: StatusModel.REGISTERED,
		});

		await this.deletionRequestRepo.create(newDeletionRequest);

		return { requestId: newDeletionRequest.id, deletionPlannedAt: newDeletionRequest.deleteAfter };
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

		return deletionRequest;
	}

	async findAllItemsToExecute(limit?: number): Promise<DeletionRequest[]> {
		const threshold = this.configService.get<number>('ADMIN_API__MODIFICATION_THRESHOLD_MS');
		const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsToExecution(threshold, limit);

		return itemsToDelete;
	}

	async countPendingDeletionRequests(): Promise<number> {
		const numberItemsWithStatusPending: number = await this.deletionRequestRepo.countPendingDeletionRequests();

		return numberItemsWithStatusPending;
	}

	async update(deletionRequestToUpdate: DeletionRequest): Promise<void> {
		await this.deletionRequestRepo.update(deletionRequestToUpdate);
	}

	async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		return this.deletionRequestRepo.markDeletionRequestAsExecuted(deletionRequestId);
	}

	async markDeletionRequestAsFailed(deletionRequestId: EntityId): Promise<boolean> {
		return this.deletionRequestRepo.markDeletionRequestAsFailed(deletionRequestId);
	}

	async markDeletionRequestAsPending(deletionRequestId: EntityId): Promise<boolean> {
		return this.deletionRequestRepo.markDeletionRequestAsPending(deletionRequestId);
	}

	async deleteById(deletionRequestId: EntityId): Promise<void> {
		await this.deletionRequestRepo.deleteById(deletionRequestId);
	}
}
