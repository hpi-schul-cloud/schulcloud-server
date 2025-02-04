import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { DeletionBatch } from '../../domain/do';
import { CreateDeletionBatchParams, DeletionBatchService, DeletionBatchSummary } from '../../domain/service';

@Injectable()
export class DeletionBatchUc {
	constructor(private readonly deletionBatchService: DeletionBatchService) {}

	public async getDeletionBatchSummaries(
		findOptions: IFindOptions<DeletionBatchSummary> = {}
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches = await this.deletionBatchService.getDeletionBatchSummaries(findOptions);

		return deletionBatches;
	}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatchSummary> {
		const deletionBatch = await this.deletionBatchService.createDeletionBatch(params);

		return deletionBatch;
	}
}
