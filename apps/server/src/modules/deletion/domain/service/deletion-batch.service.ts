import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { DeletionBatchUsersRepo, UserIdsByRole, UsersCountByRole, UserWithRoles } from '../../repo';
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

export type FilterUsersByRolesResult = {
	validUserIds: EntityId[];
	invalidUserIds: EntityId[];
	skippedUserIds: EntityId[];
	usersWithRoles: UserWithRoles[];
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
		skippedIds: EntityId[] = [],
		usersWithRoles?: UserWithRoles[]
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

		const summary = await this.buildSummary(newBatch, usersWithRoles);

		return summary;
	}

	public async updateBatch({
		batchId,
		validIds,
		invalidIds,
		skippedIds,
	}: {
		batchId: EntityId;
		validIds: EntityId[];
		invalidIds: EntityId[];
		skippedIds: EntityId[];
	}): Promise<DeletionBatch> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);

		deletionBatch.targetRefIds = validIds;
		deletionBatch.invalidIds = invalidIds;
		deletionBatch.skippedIds = skippedIds;
		deletionBatch.updatedAt = new Date();

		await this.deletionBatchRepo.save(deletionBatch);

		return deletionBatch;
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
		const validIds = deletionBatch.targetRefIds.filter(
			(id) => !deletionBatch.skippedIds.includes(id) && !deletionBatch.invalidIds.includes(id)
		);

		await this.deletionRequestService.createDeletionRequestBatch(validIds, deletionBatch.targetRefDomain, deleteAfter);

		await this.deletionBatchRepo.updateStatus(deletionBatch, BatchStatus.DELETION_REQUESTED);

		const summary = await this.buildSummary(deletionBatch);

		return summary;
	}

	// TODO implement as join on deletionbatches.targetRefIds to avoid N+1
	private getUsersCountByRoles(userWithRoles: UserWithRoles[], userIds: EntityId[]): UsersCountByRole[] {
		if (userIds.length === 0) return [];

		const targetUserIds = new Set(userIds);
		const roleCountMap = this.countRoleOccurrences(userWithRoles, targetUserIds);
		const usersCountByRole = Array.from(roleCountMap, ([roleName, userCount]) => {
			return { roleName, userCount };
		});

		return usersCountByRole;
	}

	public async filterUsersByRoles(userIds: EntityId[], allowedRoles: string[]): Promise<FilterUsersByRolesResult> {
		const validUserIds: EntityId[] = [];
		const invalidUserIds: EntityId[] = [];
		const skippedUserIds: EntityId[] = [];

		const usersWithRoles = await this.deletionBatchUsersRepo.getUsersWithRoles(userIds);

		const userRoleMap = new Map<EntityId, string[]>();
		for (const user of usersWithRoles) {
			userRoleMap.set(user.id, user.roles);
		}

		for (const userId of userIds) {
			const roles = userRoleMap.get(userId);
			if (roles && Array.isArray(roles)) {
				const hasAllowedRole = roles.some((role) => allowedRoles.includes(role));
				if (hasAllowedRole) {
					validUserIds.push(userId);
				} else {
					skippedUserIds.push(userId);
				}
			} else {
				invalidUserIds.push(userId);
			}
		}

		return { validUserIds, invalidUserIds, skippedUserIds, usersWithRoles };
	}

	private async buildSummary(batch: DeletionBatch, usersWithRoles?: UserWithRoles[]): Promise<DeletionBatchSummary> {
		let users = usersWithRoles;

		if (!users) {
			const allUserIds = [...new Set([...batch.targetRefIds, ...batch.invalidIds, ...batch.skippedIds])];
			users = await this.deletionBatchUsersRepo.getUsersWithRoles(allUserIds);
		}

		const summary: DeletionBatchSummary = {
			id: batch.id,
			name: batch.name,
			status: batch.status,
			usersByRole: this.getUsersCountByRoles(users, batch.targetRefIds),
			invalidUsers: batch.invalidIds,
			skippedUsersByRole: this.getUsersCountByRoles(users, batch.skippedIds),
			createdAt: batch.createdAt,
			updatedAt: batch.updatedAt,
		};

		return summary;
	}

	private countRoleOccurrences(usersWithRoles: UserWithRoles[], targetUserIds: Set<EntityId>): Map<string, number> {
		const roleCountMap = new Map<string, number>();

		for (const user of usersWithRoles) {
			if (targetUserIds.has(user.id)) {
				for (const role of user.roles) {
					const currentCount = roleCountMap.get(role) ?? 0;
					const updatedCount = currentCount + 1;
					roleCountMap.set(role, updatedCount);
				}
			}
		}

		return roleCountMap;
	}
}
