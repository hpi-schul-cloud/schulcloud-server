import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeletionStatusModel } from '../../../domain/types/deletion-status-model.enum';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '../../deletion-request.entity';
import { DeletionDomainModel } from '../../../domain/types/deletion-domain-model.enum';

export const deletionRequestEntityFactory = BaseFactory.define<DeletionRequestEntity, DeletionRequestEntityProps>(
	DeletionRequestEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			targetRefDomain: DeletionDomainModel.USER,
			deleteAfter: new Date(),
			targetRefId: new ObjectId().toHexString(),
			status: DeletionStatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
