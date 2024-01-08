import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { DomainModel } from '@shared/domain/types';
import { DeletionRequest, DeletionRequestProps } from '../../deletion-request.do';
import { DeletionStatusModel } from '../../types';

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
		targetRefDomain: DomainModel.USER,
		deleteAfter: new Date(),
		targetRefId: new ObjectId().toHexString(),
		status: DeletionStatusModel.REGISTERED,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
