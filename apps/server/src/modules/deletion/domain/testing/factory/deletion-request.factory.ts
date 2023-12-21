import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { DeletionRequest, DeletionRequestProps } from '../../deletion-request.do';
import { DeletionDomainModel, DeletionStatusModel } from '../../types';

class DeletionRequestFactory extends DoBaseFactory<DeletionRequest, DeletionRequestProps> {
	withUserIds(id: string): this {
		const params: DeepPartial<DeletionRequestProps> = {
			targetRefId: id,
		};

		return this.params(params);
	}
}

export const deletionRequestFactory = DeletionRequestFactory.define(DeletionRequest, () => {
	return {
		id: new ObjectId().toHexString(),
		targetRefDomain: DeletionDomainModel.USER,
		deleteAfter: new Date(),
		targetRefId: new ObjectId().toHexString(),
		status: DeletionStatusModel.REGISTERED,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
