/* istanbul ignore file */
import { DrawingElementNode, DrawingElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const drawingElementNodeFactory = BaseFactory.define<DrawingElementNode, DrawingElementNodeProps>(
	DrawingElementNode,
	({ sequence }) => {
		return {
			drawingName: `drawing-name-test`,
			description: `test-description${sequence}`,
		};
	}
);
