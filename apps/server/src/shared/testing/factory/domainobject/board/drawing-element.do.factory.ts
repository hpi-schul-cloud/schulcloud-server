/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { DrawingElement, DrawingElementProps } from '@shared/domain/domainobject/board/drawing-element.do';
import { BaseFactory } from '../../base.factory';

export const drawingElementFactory = BaseFactory.define<DrawingElement, DrawingElementProps>(
	DrawingElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `element #${sequence}`,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			description: '',
		};
	}
);
