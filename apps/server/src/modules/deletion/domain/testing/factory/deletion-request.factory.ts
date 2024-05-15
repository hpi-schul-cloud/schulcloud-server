import { DoBaseFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { DeletionRequest, DeletionRequestProps } from '../../do';
import { DomainName, StatusModel } from '../../types';

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
		targetRefDomain: DomainName.USER,
		deleteAfter: new Date(),
		targetRefId: new ObjectId().toHexString(),
		status: StatusModel.REGISTERED,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
