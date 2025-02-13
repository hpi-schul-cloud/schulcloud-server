import { ObjectId } from 'bson';
import { EntityFactory } from '@testing/factory/entity.factory';

import { DeletionBatchEntity } from '../../index';
import { DeletionBatchProps } from '../../../../domain/do';
import { BatchStatus, DomainName } from '../../../../domain/types';

export const deletionBatchEntityFactory = EntityFactory.define<DeletionBatchEntity, DeletionBatchProps>(
	DeletionBatchEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			name: `deletion batch #${sequence}`,
			targetRefDomain: DomainName.USER,
			targetRefIds: [new ObjectId().toHexString()],
			status: BatchStatus.CREATED,
			skippedIds: [],
			invalidIds: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
