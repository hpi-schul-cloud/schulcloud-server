import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	CreateDeletionBatchParams,
	DeletionBatchDetails,
	DeletionBatchService,
	DeletionBatchSummary,
} from '../../domain/service';
import { BatchStatus } from '../../domain/types';
import { CantCreateDeletionRequestsForBatchErrorLoggable } from '../loggable/cant-create-deletion-requests-for-batch-error.loggable';

@Injectable()
export class DeletionBatchUc {
	constructor(private readonly deletionBatchService: DeletionBatchService, private readonly userService: UserService) {}

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

	public async createDeletionRequestForBatch(batchId: EntityId, deleteAfter: Date): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchService.findById(batchId);
		if (deletionBatch.status !== BatchStatus.CREATED) {
			throw new CantCreateDeletionRequestsForBatchErrorLoggable(batchId, deletionBatch.status);
		}
		const requestedDeletionBatch = await this.deletionBatchService.requestDeletionForBatch(deletionBatch, deleteAfter);

		return requestedDeletionBatch;
	}

	private async validateAndFilterUserIds(
		targetRefIds: EntityId[]
	): Promise<{ validUserIds: EntityId[]; invalidUserIds: EntityId[]; skippedUserIds: EntityId[] }> {
		// TODO move this in config
		const allowedUserRoles = [
			RoleName.STUDENT,
			/*
			RoleName.TEACHER,
			RoleName.ADMINISTRATOR,
			RoleName.COURSETEACHER,
			RoleName.COURSESUBSTITUTIONTEACHER,
			RoleName.COURSESTUDENT,
			RoleName.COURSEADMINISTRATOR,
			 */
		];

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
