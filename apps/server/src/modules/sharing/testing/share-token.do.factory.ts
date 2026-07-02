/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Factory } from 'fishery';
import { ShareTokenDO, ShareTokenParentType } from '../domainobject/share-token.do';

class ShareTokenDOFactory extends Factory<ShareTokenDO> {
	/* istanbul ignore next */
	withId(id?: EntityId): this {
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
