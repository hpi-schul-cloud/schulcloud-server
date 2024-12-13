import { Factory } from 'fishery';
import { VidisResponse } from '../response';
import { vidisItemResponseFactory } from './vidis-item.response.factory';

export const vidisResponseFactory = Factory.define<VidisResponse>(() => {
	return {
		items: vidisItemResponseFactory.buildList(3),
	};
});
