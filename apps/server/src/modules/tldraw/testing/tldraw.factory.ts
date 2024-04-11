import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { TldrawDrawing, TldrawDrawingProps } from '../entities';

export const tldrawEntityFactory = BaseFactory.define<TldrawDrawing, TldrawDrawingProps>(
	TldrawDrawing,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			docName: 'test-name',
			value: Buffer.from('test'),
			version: `v1`,
			action: 'update',
			clock: sequence,
			part: sequence,
		};
	}
);
