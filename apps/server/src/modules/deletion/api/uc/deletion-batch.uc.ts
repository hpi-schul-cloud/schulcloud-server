import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserService } from '@modules/user';
import { DeletionBatchRepo } from '../../repo';
import {
	CreateDeletionBatchParams,
	DeletionBatchDetails,
	DeletionBatchService,
	DeletionBatchSummary,
} from '../../domain/service';

@Injectable()
export class DeletionBatchUc {
	constructor(
		private readonly deletionBatchService: DeletionBatchService,
		private readonly deletionBatchRepo: DeletionBatchRepo,
		private readonly userService: UserService
	) {}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const { validUserIds, invalidUserIds, skippedUserIds } = await this.validateAndFilterUserIds(params.targetRefIds);
		const deletionBatch = await this.deletionBatchService.createDeletionBatch(
			params,
			validUserIds,
			invalidUserIds,
			skippedUserIds
		);

		return deletionBatch;
	}

	public async deleteDeletionBatch(batchId: EntityId): Promise<void> {
		await this.deletionBatchService.deleteDeletionBatch(batchId);
	}

	public async getDeletionBatchDetails(batchId: EntityId): Promise<DeletionBatchDetails> {
		const deletionBatchDetails = await this.deletionBatchService.getDeletionBatchDetails(batchId);

		return deletionBatchDetails;
	}

	public async getDeletionBatchSummaries(
		findOptions: IFindOptions<DeletionBatchSummary> = {}
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches = await this.deletionBatchService.getDeletionBatchSummaries(findOptions);

		return deletionBatches;
	}

	public async createDeletionRequestForBatch(batchId: EntityId): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);
		const requestedDeletionBatch = await this.deletionBatchService.requestDeletionForBatch(deletionBatch);

		return requestedDeletionBatch;
	}

	private async validateAndFilterUserIds(
		targetRefIds: EntityId[]
	): Promise<{ validUserIds: EntityId[]; invalidUserIds: EntityId[]; skippedUserIds: EntityId[] }> {
		// TODO move this in config
		const allowedUserRoles = [RoleName.STUDENT];

		const validUserIds: EntityId[] = [];
		const invalidUserIds: EntityId[] = [];
		const skippedUserIds: EntityId[] = [];

		// TODO optimise findByIdsAndRoles
		const userChecks = targetRefIds.map(async (userId) => {
			const user = await this.userService.findByIdOrNull(userId);
			if (user) {
				if (user.roles.some((role) => allowedUserRoles.includes(role.name))) {
					validUserIds.push(userId);
				} else {
					skippedUserIds.push(userId);
				}
			} else {
				invalidUserIds.push(userId);
			}
		});

		await Promise.all(userChecks);

		return { validUserIds, invalidUserIds, skippedUserIds };
	}
}
