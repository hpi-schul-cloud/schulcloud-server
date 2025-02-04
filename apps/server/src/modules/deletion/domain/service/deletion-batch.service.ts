import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionBatchSummaryRepo, UsersByRole } from '../../repo';
import { DeletionBatchRepo } from '../../repo/deletion-batch.repo';
import { DeletionBatch } from '../do';
import { DomainName } from '../types';

export type CreateDeletionBatchParams = {
	name: string;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
};

export type DeletionBatchSummary = {
	id: EntityId;
	name: string;
	status: string;
	usersByRole: UsersByRole[];
};

// TODO: tests missing
@Injectable()
export class DeletionBatchService {
	constructor(
		private readonly deletionBatchRepo: DeletionBatchRepo,
		private readonly deletionBatchSummaryRepo: DeletionBatchSummaryRepo
	) {}

	public async createDeletionBatch(params: CreateDeletionBatchParams): Promise<DeletionBatch> {
		const newBatch = new DeletionBatch({
			id: new ObjectId().toHexString(),
			name: params.name,
			targetRefDomain: params.targetRefDomain,
			targetRefIds: params.targetRefIds,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.deletionBatchRepo.save(newBatch);

		return newBatch;
	}

	public async getDeletionBatches(
		findOptions: IFindOptions<DeletionBatchSummary>
	): Promise<Page<DeletionBatchSummary>> {
		const deletionBatches: Page<DeletionBatch> = await this.deletionBatchRepo.findDeletionBatches(findOptions);

		const summaries: DeletionBatchSummary[] = await Promise.all(
			deletionBatches.data.map(async (batch) => {
				return {
					id: batch.id,
					name: batch.name,
					status: 'created', // TODO implement status
					usersByRole: await this.getSummary(batch.targetRefIds),
				};
			})
		);

		const page: Page<DeletionBatchSummary> = {
			data: summaries,
			total: deletionBatches.total,
		};

		return page;
	}

	// TODO implement as join on deletionbatches.targetRefIds to avoid N+1
	public async getSummary(userIds: EntityId[]): Promise<UsersByRole[]> {
		const usersByRole = await this.deletionBatchSummaryRepo.countUsersByRole(userIds);

		return usersByRole;
	}
}
