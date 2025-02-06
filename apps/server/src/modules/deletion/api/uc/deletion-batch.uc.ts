import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import {
	CreateDeletionBatchParams,
	DeletionBatchDetails,
	DeletionBatchService,
	DeletionBatchSummary,
	DeletionRequestService,
} from '../../domain/service';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo/user';
import { DeletionBatchRepo } from '@modules/deletion/repo';
import { DomainName } from '@modules/deletion/domain/types';

@Injectable()
export class DeletionBatchUc {
	constructor(
		private readonly deletionBatchService: DeletionBatchService,
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionBatchRepo: DeletionBatchRepo,
		private readonly userRepo: UserRepo
	) {}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const { validUserIds, invalidUserIds } = await this.validateAndFilterUserIds(params.targetRefIds);
		const deletionBatch = await this.deletionBatchService.createDeletionBatch(params, validUserIds, invalidUserIds);

		return deletionBatch;
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

	public async createDeletionRequestForBatch(batchId: EntityId): Promise<void> {
		const deletionBatch = await this.deletionBatchRepo.findById(batchId);
		for (const targetRefId of deletionBatch.targetRefIds) {
			const deleteNow = new Date(Date.now());
			await this.deletionRequestService.createDeletionRequest(targetRefId, DomainName.USER, deleteNow);
		}
	}

	private async validateAndFilterUserIds(
		targetRefIds: EntityId[]
	): Promise<{ validUserIds: EntityId[]; invalidUserIds: EntityId[] }> {
		const validUserIds: EntityId[] = [];
		const invalidUserIds: EntityId[] = [];

		for (const userId of targetRefIds) {
			const userExists = await this.userRepo.findByIdOrNull(userId);
			if (userExists) {
				validUserIds.push(userId);
			} else {
				invalidUserIds.push(userId);
			}
		}

		return { validUserIds, invalidUserIds };
	}
}
