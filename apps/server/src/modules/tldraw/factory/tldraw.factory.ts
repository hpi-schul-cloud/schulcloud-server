import { BaseFactory } from '@shared/testing/factory/base.factory';
import { TldrawDrawing, TldrawDrawingProps } from '@src/modules/tldraw/entities';

export const tldrawEntityFactory = BaseFactory.define<TldrawDrawing, TldrawDrawingProps>(
	TldrawDrawing,
	({ sequence }) => {
		return {
			id: 'test',
			docName: 'test-name',
			value: 'test-value',
			version: `test-version-${sequence}`,
		};
	}
);
