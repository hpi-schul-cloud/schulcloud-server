import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { DeletionBatch, DeletionBatchProps } from '../../do';
import { BatchStatus, DomainName } from '../../types';

class DeletionBatchFactory extends DoBaseFactory<DeletionBatch, DeletionBatchProps> {
	withTargetRefIds(ids: string[]): this {
		const params: Partial<DeletionBatchProps> = {
			targetRefIds: ids,
		};

		return this.params(params);
	}

	withInvalidIds(ids: string[]): this {
		const params: Partial<DeletionBatchProps> = {
			invalidIds: ids,
		};

		return this.params(params);
	}

	withSkippedIds(ids: string[]): this {
		const params: Partial<DeletionBatchProps> = {
			skippedIds: ids,
		};

		return this.params(params);
	}
}

export const deletionBatchFactory = DeletionBatchFactory.define(DeletionBatch, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'Deletion Batch',
		status: BatchStatus.CREATED,
		targetRefDomain: DomainName.USER,
		targetRefIds: [],
		invalidIds: [],
		skippedIds: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
