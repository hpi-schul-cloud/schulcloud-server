import { AccountService } from '@modules/account';
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

@Injectable()
export class DeletionBatchUc {
	constructor(
		private readonly deletionBatchService: DeletionBatchService,
		private readonly accountService: AccountService
	) {}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchService.createDeletionBatch(params);

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

	public async requestDeletionForBatch(batchId: EntityId, deleteAfter: Date): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchService.findById(batchId);

		if (deletionBatch.status !== BatchStatus.CREATED) {
			throw new CantCreateDeletionRequestsForBatchErrorLoggable(batchId, deletionBatch.status);
		}

		const summary = await this.deletionBatchService.requestDeletionForBatch(batchId, deleteAfter);

		if (deletionBatch.targetRefDomain === DomainName.USER) {
			await this.accountService.deactivateMultipleAccounts(deletionBatch.targetRefIds, new Date());
		}

		return summary;
	}
}
