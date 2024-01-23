import { BaseFactory } from '@shared/testing/factory/base.factory';
import { TldrawDrawing, TldrawDrawingProps } from '../entities';

export const tldrawEntityFactory = BaseFactory.define<TldrawDrawing, TldrawDrawingProps>(
	TldrawDrawing,
	({ sequence }) => {
		return {
			_id: 'test-id',
			id: 'test-id',
			docName: 'test-name',
			value: 'test-value',
			version: `test-version-${sequence}`,
		};
	}
);
