import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { DrawingElement, DrawingElementProps, ROOT_PATH } from '../domain';

export const drawingElementFactory = BaseFactory.define<DrawingElement, DrawingElementProps>(
	DrawingElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			description: `caption #${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
