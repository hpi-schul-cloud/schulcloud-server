import { Factory } from 'fishery';
import { TldrawShape, TldrawShapeType } from '../types';

export const tldrawShapeFactory = Factory.define<TldrawShape>(({ sequence }) => {
	return {
		id: `shape-${sequence}`,
		type: TldrawShapeType.Image,
		assetId: `asset-${sequence}`,
	};
});
