import { AccountService } from '@modules/account';
import { RoleName } from '@modules/role';
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
import { BatchStatus, DomainName } from '../../domain/types';
import { CantCreateDeletionRequestsForBatchErrorLoggable } from '../loggable/cant-create-deletion-requests-for-batch-error.loggable';

const revalidateAfterMinutes = 60;

@Injectable()
export class DeletionBatchUc {
	constructor(
		private readonly deletionBatchService: DeletionBatchService,
		private readonly accountService: AccountService
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

	public async createDeletionRequestForBatch(batchId: EntityId, deleteAfter: Date): Promise<DeletionBatchSummary> {
		let deletionBatch = await this.deletionBatchService.findById(batchId);

		if (deletionBatch.status !== BatchStatus.CREATED) {
			throw new CantCreateDeletionRequestsForBatchErrorLoggable(batchId, deletionBatch.status);
		}

		const revalidate = deletionBatch.createdAt.getTime() + revalidateAfterMinutes * 60 * 1000 < Date.now();

		if (revalidate) {
			const allSavedUserIds = [...deletionBatch.targetRefIds, ...deletionBatch.invalidIds, ...deletionBatch.skippedIds];
			const { validUserIds, invalidUserIds, skippedUserIds } = await this.validateAndFilterUserIds(allSavedUserIds);
			deletionBatch = await this.deletionBatchService.updateBatch({
				batchId,
				validIds: validUserIds,
				invalidIds: invalidUserIds,
				skippedIds: skippedUserIds,
			});
		}

		const requestedDeletionBatch = await this.deletionBatchService.requestDeletionForBatch(deletionBatch, deleteAfter);

		if (deletionBatch.targetRefDomain === DomainName.USER) {
			await this.accountService.deactivateMultipleAccounts(deletionBatch.targetRefIds, new Date());
		}

		return requestedDeletionBatch;
	}

	private async validateAndFilterUserIds(
		targetRefIds: EntityId[]
	): Promise<{ validUserIds: EntityId[]; invalidUserIds: EntityId[]; skippedUserIds: EntityId[] }> {
		// TODO move this in config
		const allowedUserRoles = [
			RoleName.STUDENT,
			RoleName.COURSESTUDENT,
			RoleName.TEACHER,
			RoleName.COURSETEACHER,
			RoleName.COURSESUBSTITUTIONTEACHER,
			RoleName.ADMINISTRATOR,
			RoleName.COURSEADMINISTRATOR,
		];

		const { validUserIds, invalidUserIds, skippedUserIds } = await this.deletionBatchService.filterUsersByRoles(
			targetRefIds,
			allowedUserRoles
		);

		return { validUserIds, invalidUserIds, skippedUserIds };
	}
}
