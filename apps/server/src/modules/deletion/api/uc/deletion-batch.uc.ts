import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { DeletionBatch } from '../../domain/do';
import { CreateDeletionBatchParams, DeletionBatchService, DeletionBatchSummary } from '../../domain/service';

@Injectable()
export class DeletionBatchUc {
	constructor(private readonly deletionBatchService: DeletionBatchService) {}

	public async getDeletionBatches(
		findOptions: IFindOptions<DeletionBatchSummary> = {}
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches = await this.deletionBatchService.getDeletionBatches(findOptions);

		return deletionBatches;
	}

	// public async getSummary(): Promise<UsersByRole[]> {
	// 	const usersByRole = await this.deletionBatchService.getSummary();

	// 	return usersByRole;
	// }

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatch> {
		const deletionBatch = await this.deletionBatchService.createDeletionBatch(params);

		return deletionBatch;
	}
}
