import { IShareableProperties, Shareable, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const shareableFactory = BaseFactory.define<Shareable, IShareableProperties>(Shareable, ({ sequence }) => {
	return {
		token: `token-${sequence}`,
		parentType: ShareTokenParentType.Course,
		parentId: new ObjectId(),
	};
});
