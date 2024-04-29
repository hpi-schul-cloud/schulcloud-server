import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { FileElement, FileElementProps, ROOT_PATH } from '../domain';

export const fileElementFactory = BaseFactory.define<FileElement, FileElementProps>(FileElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		caption: `caption #${sequence}`,
		alternativeText: `alternative-text #${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
