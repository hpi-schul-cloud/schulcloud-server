import { ObjectId } from '@mikro-orm/mongodb';
import { FileElement, FileElementProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

export const fileElementFactory = BaseFactory.define<FileElement, FileElementProps>(FileElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		caption: `file #${sequence}`,
		alternativeText: `alternative-text #${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
