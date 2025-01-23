/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { ShareTokenDO, ShareTokenParentType } from '@modules/sharing/domainobject/share-token.do';
import { EntityId } from '@shared/domain/types';
import { Factory } from 'fishery';

class ShareTokenDOFactory extends Factory<ShareTokenDO> {
	/* istanbul ignore next */
	withId(id?: EntityId) {
		return this.params({ id: new ObjectId(id).toHexString() });
	}
}

export const shareTokenDOFactory = ShareTokenDOFactory.define(({ sequence }) => {
	return {
		token: `share-token-${sequence}`,
		payload: {
			parentType: ShareTokenParentType.Course,
			parentId: new ObjectId().toHexString(),
		},
	};
});
