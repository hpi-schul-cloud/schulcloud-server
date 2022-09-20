import { IShareTokenProperties, ShareToken, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const shareTokenFactory = BaseFactory.define<ShareToken, IShareTokenProperties>(ShareToken, ({ sequence }) => {
	return {
		token: `token-${sequence}`,
		parentType: ShareTokenParentType.Course,
		parentId: new ObjectId(),
	};
});
