import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { H5PElementProps, ROOT_PATH } from '../domain';
import { H5PElement } from '../domain/h5p-element.do';

export const h5pElementFactory = BaseFactory.define<H5PElement, H5PElementProps>(H5PElement, () => {
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
