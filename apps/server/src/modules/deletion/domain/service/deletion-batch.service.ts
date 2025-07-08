import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionBatchUsersRepo, UserIdsByRole, UsersCountByRole } from '../../repo';
import { DeletionBatchRepo } from '../../repo/deletion-batch.repo';
import { DeletionBatch, DeletionRequest } from '../do';
import { BatchStatus, DomainName, StatusModel } from '../types';
import { DeletionRequestService } from './deletion-request.service';

export type CreateDeletionBatchParams = {
	name: string;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
};

export type DeletionBatchDetails = {
	id: EntityId;
	pendingDeletions: EntityId[];
	failedDeletions: EntityId[];
	successfulDeletions: EntityId[];
	invalidIds: EntityId[];
	skippedUsersByRole: UserIdsByRole[];
};

export type DeletionBatchSummary = {
	id: EntityId;
	name: string;
	status: BatchStatus;
	usersByRole: UsersCountByRole[];
	invalidUsers: EntityId[];
	skippedUsersByRole: UsersCountByRole[];
	createdAt: Date;
	updatedAt: Date;
};

@Injectable()
export class DeletionBatchService {
	constructor(
		private readonly deletionBatchRepo: DeletionBatchRepo,
		private readonly deletionBatchUsersRepo: DeletionBatchUsersRepo,
		private readonly deletionRequestService: DeletionRequestService
	) {}

	public async findById(batchId: EntityId): Promise<DeletionBatch> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		return deletionBatch;
	}

	public async createDeletionBatch(
		params: CreateDeletionBatchParams,
		validUserIds: EntityId[],
		invalidIds: EntityId[] = [],
		skippedIds: EntityId[] = []
	): Promise<DeletionBatchSummary> {
		const newBatch = new DeletionBatch({
			id: new ObjectId().toHexString(),
			name: params.name,
			status: BatchStatus.CREATED,
			targetRefDomain: params.targetRefDomain,
			targetRefIds: validUserIds,
			invalidIds,
			skippedIds,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.deletionBatchRepo.save(newBatch);

		const summary = await this.buildSummary(newBatch);

		return summary;
	}

	public async deleteDeletionBatch(batchId: EntityId): Promise<void> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		await this.deletionBatchRepo.delete(deletionBatch);
	}

	public async getDeletionBatchDetails(batchId: EntityId): Promise<DeletionBatchDetails> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		const failedDeletions: DeletionRequest[] = await this.deletionRequestService.findByStatusAndTargetRefId(
			StatusModel.FAILED,
			deletionBatch.targetRefIds
		);
		const failedDeletionUserIds: EntityId[] = failedDeletions.map((deletionRequest) => deletionRequest.targetRefId);

		const pendingDeletions: DeletionRequest[] = await this.deletionRequestService.findByStatusAndTargetRefId(
			StatusModel.PENDING,
			deletionBatch.targetRefIds
		);
		const pendingDeletionUserIds: EntityId[] = pendingDeletions.map((deletionRequest) => deletionRequest.targetRefId);

		const successfulDeletions: DeletionRequest[] = await this.deletionRequestService.findByStatusAndTargetRefId(
			StatusModel.SUCCESS,
			deletionBatch.targetRefIds
		);
		const successfulDeletionUserIds: EntityId[] = successfulDeletions.map(
			(deletionRequest) => deletionRequest.targetRefId
		);

		const skippedUsers = await this.deletionBatchUsersRepo.getUsersByRole(deletionBatch.skippedIds);

		const summary: DeletionBatchDetails = {
			id: deletionBatch.id,
			pendingDeletions: pendingDeletionUserIds,
			failedDeletions: failedDeletionUserIds,
			successfulDeletions: successfulDeletionUserIds,
			invalidIds: deletionBatch.invalidIds,
			skippedUsersByRole: skippedUsers,
		};

		return summary;
	}

	public async getDeletionBatchSummaries(
		findOptions: IFindOptions<DeletionBatchSummary>
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches: Page<DeletionBatch> = await this.deletionBatchRepo.findDeletionBatches(findOptions);

		const summaries: DeletionBatchSummary[] = await Promise.all(
			deletionBatches.data.map(async (batch) => {
				const summary = await this.buildSummary(batch);
				return summary;
			})
		);

		const page: Page<DeletionBatchSummary> = {
			data: summaries,
			total: deletionBatches.total,
		};

		return page;
	}

	public async requestDeletionForBatch(deletionBatch: DeletionBatch, deleteAfter: Date): Promise<DeletionBatchSummary> {
		await this.deletionRequestService.createDeletionRequestBatch(
			deletionBatch.targetRefIds,
			deletionBatch.targetRefDomain,
			deleteAfter
		);

		await this.deletionBatchRepo.updateStatus(deletionBatch, BatchStatus.DELETION_REQUESTED);

		const summary = await this.buildSummary(deletionBatch);

		return summary;
	}

	// TODO implement as join on deletionbatches.targetRefIds to avoid N+1
	private async getUsersCountByRoles(userIds: EntityId[]): Promise<UsersCountByRole[]> {
		const usersByRole = await this.deletionBatchUsersRepo.countUsersByRole(userIds);

		return usersByRole;
	}

	private async buildSummary(batch: DeletionBatch): Promise<DeletionBatchSummary> {
		const summary: DeletionBatchSummary = {
			id: batch.id,
			name: batch.name,
			status: batch.status,
			usersByRole: await this.getUsersCountByRoles(batch.targetRefIds),
			invalidUsers: batch.invalidIds,
			skippedUsersByRole: await this.getUsersCountByRoles(batch.skippedIds),
			createdAt: batch.createdAt,
			updatedAt: batch.updatedAt,
		};

		return summary;
	}
}
