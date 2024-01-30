import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DomainName } from '@shared/domain/types';
import { DeletionStatusModel } from '../../../domain/types';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '../../deletion-request.entity';

export const deletionRequestEntityFactory = BaseFactory.define<DeletionRequestEntity, DeletionRequestEntityProps>(
	DeletionRequestEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			targetRefDomain: DomainName.USER,
			deleteAfter: new Date(),
			targetRefId: new ObjectId().toHexString(),
			status: DeletionStatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
