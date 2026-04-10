import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DomainName, StatusModel } from '../../../../domain/types';
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
