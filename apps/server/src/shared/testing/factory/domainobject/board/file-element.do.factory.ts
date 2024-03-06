/* istanbul ignore file */
import { FileElement, FileElementProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const fileElementFactory = BaseFactory.define<FileElement, FileElementProps>(FileElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		caption: `<p>caption #${sequence}</p>`,
		alternativeText: `alternativeText #${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
