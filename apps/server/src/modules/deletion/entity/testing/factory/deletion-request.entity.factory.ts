import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeletionDomainModel } from '@src/modules/deletion/domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '@src/modules/deletion/domain/types/deletion-status-model.enum';
import { DeletionRequestEntity, DeletionRequestEntityProps } from '@src/modules/deletion/entity';

export const deletionRequestEntityFactory = BaseFactory.define<DeletionRequestEntity, DeletionRequestEntityProps>(
	DeletionRequestEntity,
	() => {
		return {
			id: new ObjectId().toHexString(),
			domain: DeletionDomainModel.USER,
			deleteAfter: new Date(),
			itemId: new ObjectId().toHexString(),
			status: DeletionStatusModel.REGISTERED,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
