import { Factory } from 'fishery';
import { TldrawAsset, TldrawShapeType } from '../types';

export const tldrawAssetFactory = Factory.define<TldrawAsset>(({ sequence }) => {
	return {
		id: `asset-${sequence}`,
		type: TldrawShapeType.Image,
		name: 'img.png',
		src: `/filerecordid-${sequence}/file1.jpg`,
	};
});
