import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { DeletionRequest, DeletionRequestProps } from '../../deletion-request.do';
import { DeletionDomainModel } from '../../types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../../types/deletion-status-model.enum';

class DeletionRequestFactory extends DoBaseFactory<DeletionRequest, DeletionRequestProps> {
	withUserIds(itemId: string): this {
		const params: DeepPartial<DeletionRequestProps> = {
			itemId,
		};

		return this.params(params);
	}
}

export const deletionRequestFactory = DeletionRequestFactory.define(DeletionRequest, () => {
	return {
		id: new ObjectId().toHexString(),
		domain: DeletionDomainModel.USER,
		deleteAfter: new Date(),
		itemId: new ObjectId().toHexString(),
		status: DeletionStatusModel.REGISTERED,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
