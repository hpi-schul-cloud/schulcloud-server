import { EntityId, ShareTokenDO, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';

class ShareTokenFactory extends Factory<ShareTokenDO> {
	withId(id?: EntityId) {
		return this.params({ id: new ObjectId(id).toHexString() });
	}
}

export const shareTokenFactory = ShareTokenFactory.define(({ sequence }) => ({
	token: `share-token-${sequence}`,
	payload: {
		parentType: ShareTokenParentType.Course,
		parentId: new ObjectId().toHexString(),
	},
}));
