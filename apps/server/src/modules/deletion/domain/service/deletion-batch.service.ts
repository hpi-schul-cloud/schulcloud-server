import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { DeletionBatchUsersRepo } from '../../repo';
import { DeletionBatchRepo } from '../../repo/deletion-batch.repo';
import { DeletionBatch } from '../do';
import { BatchStatus, DomainName } from '../types';
import { DeletionRequestService } from './deletion-request.service';

export type CreateDeletionBatchParams = {
	name: string;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
};

export type DeletionBatchDetails = {
	id: EntityId;
	name: string;
	status: BatchStatus;
	validUsers: EntityId[];
	invalidUsers: EntityId[];
	skippedUsers: EntityId[];
	pendingDeletions: EntityId[];
	failedDeletions: EntityId[];
	successfulDeletions: EntityId[];
	createdAt: Date;
	updatedAt: Date;
};

export type DeletionBatchSummary = {
	id: EntityId;
	name: string;
	status: BatchStatus;
	validUsers: number;
	invalidUsers: number;
	skippedUsers: number;
	createdAt: Date;
	updatedAt: Date;
};

export const ALLOWED_USER_ROLES_FOR_BATCH_DELETION = [
	RoleName.STUDENT,
	RoleName.COURSESTUDENT,
	RoleName.TEACHER,
	RoleName.COURSETEACHER,
	RoleName.COURSESUBSTITUTIONTEACHER,
	RoleName.ADMINISTRATOR,
	RoleName.COURSEADMINISTRATOR,
];

const isOlderThanMinutes = (date: Date, minutes: number): boolean => date.getTime() + minutes * 60 * 1000 < Date.now();

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

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const { validUserIds, invalidUserIds, skippedUserIds } = await this.validateDeletionBatch(params.targetRefIds);

		const newBatch = new DeletionBatch({
			id: new ObjectId().toHexString(),
			name: params.name,
			status: BatchStatus.CREATED,
			targetRefDomain: params.targetRefDomain,
			targetRefIds: validUserIds,
			invalidIds: invalidUserIds,
			skippedIds: skippedUserIds,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.deletionBatchRepo.save(newBatch);

		const summary = this.buildSummary(newBatch);

		return summary;
	}

	public async deleteDeletionBatch(batchId: EntityId): Promise<void> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		await this.deletionBatchRepo.delete(deletionBatch);
	}

	public async getDeletionBatchDetails(batchId: EntityId): Promise<DeletionBatchDetails> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		const { pending, failed, success } = await this.deletionRequestService.getStatusOfDeletionRequestBatch(batchId);

		const details: DeletionBatchDetails = {
			id: deletionBatch.id,
			name: deletionBatch.name,
			status: deletionBatch.status,
			validUsers: deletionBatch.targetRefIds,
			invalidUsers: deletionBatch.invalidIds,
			skippedUsers: deletionBatch.skippedIds,
			pendingDeletions: pending,
			failedDeletions: failed,
			successfulDeletions: success,
			createdAt: deletionBatch.createdAt,
			updatedAt: deletionBatch.updatedAt,
		};

		return details;
	}

	public async getDeletionBatchSummaries(
		findOptions: IFindOptions<DeletionBatchSummary>
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches = await this.deletionBatchRepo.findDeletionBatches(findOptions);

		const summaries = deletionBatches.data.map((batch) => this.buildSummary(batch));

		const page: Page<DeletionBatchSummary> = {
			data: summaries,
			total: deletionBatches.total,
		};

		return page;
	}

	public async requestDeletionForBatch(batchId: EntityId, deleteAfter: Date): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		const revalidate = isOlderThanMinutes(deletionBatch.createdAt, 60);

		if (revalidate) {
			const allSavedUserIds = [...deletionBatch.targetRefIds, ...deletionBatch.invalidIds, ...deletionBatch.skippedIds];
			const { validUserIds, invalidUserIds, skippedUserIds } = await this.validateDeletionBatch(allSavedUserIds);
			deletionBatch.updateIds({
				targetRefIds: validUserIds,
				invalidIds: invalidUserIds,
				skippedIds: skippedUserIds,
			});
		}

		await this.deletionRequestService.createMultipleDeletionRequests(
			batchId,
			deletionBatch.targetRefIds,
			deletionBatch.targetRefDomain,
			deleteAfter
		);

		deletionBatch.startDeletion();
		await this.deletionBatchRepo.save(deletionBatch);

		const summary = this.buildSummary(deletionBatch);

		return summary;
	}

	private buildSummary(batch: DeletionBatch): DeletionBatchSummary {
		const summary: DeletionBatchSummary = {
			id: batch.id,
			name: batch.name,
			status: batch.status,
			validUsers: batch.targetRefIds.length,
			invalidUsers: batch.invalidIds.length,
			skippedUsers: batch.skippedIds.length,
			createdAt: batch.createdAt,
			updatedAt: batch.updatedAt,
		};

		return summary;
	}

	private async validateDeletionBatch(
		userIds: EntityId[]
	): Promise<{ validUserIds: EntityId[]; invalidUserIds: EntityId[]; skippedUserIds: EntityId[] }> {
		const { withAllowedRole, withoutAllowedRole } = await this.deletionBatchUsersRepo.groupUserIdsByAllowedRoles(
			userIds,
			ALLOWED_USER_ROLES_FOR_BATCH_DELETION
		);

		const validUserIds = withAllowedRole.map((u) => u.id);
		const skippedUserIds = withoutAllowedRole.map((u) => u.id);
		const foundUserIds = new Set([...validUserIds, ...skippedUserIds]);
		const invalidUserIds = userIds.filter((id) => !foundUserIds.has(id));

		return { validUserIds, invalidUserIds, skippedUserIds };
	}
}
