import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from '../../deletion.config';
import { DeletionRequestRepo } from '../../repo';
import { DeletionRequest } from '../do';
import { DomainName, StatusModel } from '../types';

@Injectable()
export class DeletionRequestService {
	constructor(
		private readonly deletionRequestRepo: DeletionRequestRepo,
		@Inject(DELETION_CONFIG_TOKEN)
		private readonly config: DeletionConfig
	) {}

	public async createDeletionRequestBatch(
		targetRefIds: EntityId[],
		targetRefDomain: DomainName,
		deleteAfter: Date
	): Promise<void> {
		const deletionRequests = targetRefIds.map(
			(targetRefId) =>
				new DeletionRequest({
					id: new ObjectId().toHexString(),
					targetRefDomain,
					deleteAfter,
					targetRefId,
					status: StatusModel.REGISTERED,
				})
		);

		await this.deletionRequestRepo.create(deletionRequests);
	}

	public async createDeletionRequest(
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

	public async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequest = await this.deletionRequestRepo.findById(deletionRequestId);

		return deletionRequest;
	}

	public async findByIds(deletionRequestIds: EntityId[]): Promise<(DeletionRequest | null)[]> {
		const deletionRequests = await this.deletionRequestRepo.findByIds(deletionRequestIds);

		return deletionRequests;
	}

	public async findAllItemsToExecute(limit: number, getFailed = false): Promise<DeletionRequest[]> {
		const { adminApiDeletionModificationThresholdMs, adminApiDeletionConsiderFailedAfterMs } = this.config;
		const newerThan = new Date(Date.now() - adminApiDeletionConsiderFailedAfterMs);
		const olderThan = new Date(Date.now() - adminApiDeletionModificationThresholdMs);
		const deletionRequests = getFailed
			? await this.deletionRequestRepo.findAllFailedItems(limit, olderThan, newerThan)
			: await this.deletionRequestRepo.findAllItems(limit);

		return deletionRequests;
	}

	public findByStatusAndTargetRefId(status: StatusModel, targetRefIds: EntityId[]): Promise<DeletionRequest[]> {
		switch (status) {
			case StatusModel.REGISTERED:
				return this.deletionRequestRepo.findRegisteredByTargetRefId(targetRefIds);
			case StatusModel.PENDING:
				return this.deletionRequestRepo.findPendingByTargetRefId(targetRefIds);
			case StatusModel.FAILED:
				return this.deletionRequestRepo.findFailedByTargetRefId(targetRefIds);
			case StatusModel.SUCCESS:
				return this.deletionRequestRepo.findSuccessfulByTargetRefId(targetRefIds);
			default:
				return Promise.resolve([]);
		}
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
