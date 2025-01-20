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
	private olderThan: Date;

	private newerThan: Date;

	constructor(
		private readonly deletionRequestRepo: DeletionRequestRepo,
		private readonly configService: ConfigService<DeletionConfig, true>
	) {
		const thresholdOlder = this.configService.get<number>('ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS');
		this.olderThan = new Date(Date.now() - thresholdOlder);

		const thresholdNewer = this.configService.get<number>('ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS');
		this.newerThan = new Date(Date.now() - thresholdNewer);
	}

	async createDeletionRequest(
		targetRefId: EntityId,
		targetRefDomain: DomainName,
		deleteAfter: Date
	): Promise<{ requestId: EntityId; deletionPlannedAt: Date }> {
		const newDeletionRequest = new DeletionRequest({
			id: new ObjectId().toHexString(),
			targetRefDomain,
			deleteAfter,
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

	async findAllItemsToExecute(limit: number): Promise<DeletionRequest[]> {
		const deletionRequests = await this.deletionRequestRepo.findAllItemsToExecution(
			this.olderThan,
			this.newerThan,
			limit
		);

		return deletionRequests;
	}

	async countPendingDeletionRequests(): Promise<number> {
		const numberItemsWithStatusPending: number = await this.deletionRequestRepo.countPendingDeletionRequests(
			this.olderThan,
			this.newerThan
		);

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
