/* istanbul ignore file */
import { DrawingElementNode, DrawingElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const drawingElementNodeFactory = BaseFactory.define<DrawingElementNode, DrawingElementNodeProps>(
	DrawingElementNode,
	({ sequence }) => {
		return {
			description: `test-description-${sequence}`,
		};
	}
);
