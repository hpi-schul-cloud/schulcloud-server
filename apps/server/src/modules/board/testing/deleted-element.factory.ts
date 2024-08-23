import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { ContentElementType, DeletedElement, DeletedElementProps, ROOT_PATH } from '../domain';

export const deletedElementFactory = BaseFactory.define<DeletedElement, DeletedElementProps>(
	DeletedElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			title: `Title #${sequence}`,
			deletedElementType: ContentElementType.EXTERNAL_TOOL,
		};
	}
);
