import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionBatchSummaryRepo, DeletionRequestRepo, UsersByRole } from '../../repo';
import { DeletionBatchRepo } from '../../repo/deletion-batch.repo';
import { DeletionBatch, DeletionRequest } from '../do';
import { DomainName } from '../types';

export type CreateDeletionBatchParams = {
	name: string;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
};

export type DeletionBatchDetails = {
	id: EntityId;
	status: string;
	pendingDeletions: EntityId[];
	failedDeletions: EntityId[];
	successfulDeletions: EntityId[];
};

export type DeletionBatchSummary = {
	id: EntityId;
	name: string;
	status: string;
	usersByRole: UsersByRole[];
	createdAt: Date;
	updatedAt: Date;
};

// TODO: tests missing
@Injectable()
export class DeletionBatchService {
	constructor(
		private readonly deletionBatchRepo: DeletionBatchRepo,
		private readonly deletionBatchSummaryRepo: DeletionBatchSummaryRepo,
		private readonly deletionRequestRepo: DeletionRequestRepo
	) {}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const newBatch = new DeletionBatch({
			id: new ObjectId().toHexString(),
			name: params.name,
			targetRefDomain: params.targetRefDomain,
			targetRefIds: params.targetRefIds,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.deletionBatchRepo.save(newBatch);

		const summary = await this.buildSummary(newBatch);

		return summary;
	}

	public async getDeletionBatchDetails(batchId: EntityId): Promise<DeletionBatchDetails> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		const failedDeletions: DeletionRequest[] = await this.deletionRequestRepo.findFailedByTargetRefId(
			deletionBatch.targetRefIds
		);
		const failedDeletionUserIds: EntityId[] = failedDeletions.map((deletionRequest) => deletionRequest.targetRefId);

		const pendingDeletions: DeletionRequest[] = await this.deletionRequestRepo.findPendingByTargetRefId(
			deletionBatch.targetRefIds
		);
		const pendingDeletionUserIds: EntityId[] = pendingDeletions.map((deletionRequest) => deletionRequest.targetRefId);

		const successfulDeletions: DeletionRequest[] = await this.deletionRequestRepo.findSuccessfulByTargetRefId(
			deletionBatch.targetRefIds
		);
		const successfulDeletionUserIds: EntityId[] = successfulDeletions.map(
			(deletionRequest) => deletionRequest.targetRefId
		);

		const determineStatusForBatch = () => {
			if (pendingDeletions.length > 0) {
				return 'pending';
			}
			if (failedDeletions.length > 0) {
				return 'failed';
			}
			return 'successful';
		};

		const summary: DeletionBatchDetails = {
			id: deletionBatch.id,
			status: determineStatusForBatch(),
			pendingDeletions: pendingDeletionUserIds,
			failedDeletions: failedDeletionUserIds,
			successfulDeletions: successfulDeletionUserIds,
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

	// TODO implement as join on deletionbatches.targetRefIds to avoid N+1
	public async getUsersByRoles(userIds: EntityId[]): Promise<UsersByRole[]> {
		const usersByRole = await this.deletionBatchSummaryRepo.countUsersByRole(userIds);

		return usersByRole;
	}

	private async buildSummary(batch: DeletionBatch): Promise<DeletionBatchSummary> {
		const summary = {
			id: batch.id,
			name: batch.name,
			status: 'created', // TODO implement status
			usersByRole: await this.getUsersByRoles(batch.targetRefIds),
			createdAt: batch.createdAt,
			updatedAt: batch.updatedAt,
		};

		return summary;
	}
}
