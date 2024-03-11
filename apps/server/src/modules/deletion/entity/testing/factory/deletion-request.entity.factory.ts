import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '../../deletion-request.entity';
import { DomainName, StatusModel } from '../../../types';

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
