import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestRepo } from '../../repo';
import { DeletionRequest } from '../do';
import { DomainName, StatusModel } from '../types';
import { DeletionConfig } from '../../deletion.config';

@Injectable()
export class DeletionRequestService {
	constructor(
		private readonly deletionRequestRepo: DeletionRequestRepo,
		private readonly configService: ConfigService<DeletionConfig, true>
	) {}

	public async createDeletionRequest(
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

	public async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

		return deletionRequest;
	}

	public async findAllItemsToExecute(limit?: number): Promise<DeletionRequest[]> {
		const threshold = this.configService.get<number>('ADMIN_API__MODIFICATION_THRESHOLD_MS');
		const itemsToDelete: DeletionRequest[] = await this.deletionRequestRepo.findAllItemsToExecution(threshold, limit);

		return itemsToDelete;
	}

	public async countPendingDeletionRequests(): Promise<number> {
		const numberItemsWithStatusPending: number = await this.deletionRequestRepo.countPendingDeletionRequests();

		return numberItemsWithStatusPending;
	}

	public async update(deletionRequestToUpdate: DeletionRequest): Promise<void> {
		await this.deletionRequestRepo.update(deletionRequestToUpdate);
	}

	public async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		const result = await this.deletionRequestRepo.markDeletionRequestAsExecuted(deletionRequestId);
		return result;
	}

	public async markDeletionRequestAsFailed(deletionRequestId: EntityId): Promise<boolean> {
		const result = await this.deletionRequestRepo.markDeletionRequestAsFailed(deletionRequestId);
		return result;
	}

	public async markDeletionRequestAsPending(deletionRequestId: EntityId): Promise<boolean> {
		const result = await this.deletionRequestRepo.markDeletionRequestAsPending(deletionRequestId);
		return result;
	}

	public async deleteById(deletionRequestId: EntityId): Promise<void> {
		await this.deletionRequestRepo.deleteById(deletionRequestId);
	}
}
