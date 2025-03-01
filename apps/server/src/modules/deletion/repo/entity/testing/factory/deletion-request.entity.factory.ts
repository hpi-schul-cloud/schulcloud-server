import { DomainName, StatusModel } from '@modules/deletion/domain/types';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '../../deletion-request.entity';

export const deletionRequestEntityFactory = BaseFactory.define<DeletionRequestEntity, DeletionRequestEntityProps>(
	DeletionRequestEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			targetRefDomain: DomainName.USER,
			deleteAfter: new Date(),
			targetRefId: new ObjectId().toHexString(),
			status: StatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
