import { BaseFactory } from '@shared/testing/factory/base.factory';
import { TldrawDrawing, TldrawDrawingProps } from '../entities';

export const tldrawEntityFactory = BaseFactory.define<TldrawDrawing, TldrawDrawingProps>(
	TldrawDrawing,
	({ sequence }) => {
		return {
			_id: 'test-id',
			docName: 'test-name',
			value: Buffer.from('test'),
			version: `test-version-${sequence}`,
		};
	}
);
