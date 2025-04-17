import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { H5pElementProps, ROOT_PATH } from '../domain';
import { H5pElement } from '../domain/h5p-element.do';

export const h5pElementFactory = BaseFactory.define<H5pElement, H5pElementProps>(H5pElement, () => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
