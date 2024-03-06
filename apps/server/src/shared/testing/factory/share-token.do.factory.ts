/* istanbul ignore file */
import { ShareTokenDO, ShareTokenParentType } from '@modules/sharing/domainobject/share-token.do';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
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
