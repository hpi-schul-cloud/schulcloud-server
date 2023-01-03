/* istanbul ignore file */
import { EntityId } from '@shared/domain';
import { ShareTokenDO, ShareTokenParentType } from '@src/modules/sharing/domainobject/share-token.do';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';

class ShareTokenFactory extends Factory<ShareTokenDO> {
	/* istanbul ignore next */
	withId(id?: EntityId) {
		return this.params({ id: new ObjectId(id).toHexString() });
	}
}

export const shareTokenFactory = ShareTokenFactory.define(({ sequence }) => {
	return {
		token: `share-token-${sequence}`,
		payload: {
			parentType: ShareTokenParentType.Course,
			parentId: new ObjectId().toHexString(),
		},
	};
});
