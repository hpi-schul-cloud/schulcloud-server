import { Factory } from 'fishery';
import { VidisItemResponse } from '@infra/sync/media-licenses/response/vidis-item.response';

export const vidisItemResponseFactory = Factory.define<VidisItemResponse>(({ sequence }) => {
	return {
		offerId: `${sequence}`,
		offerTitle: 'VIDIS Test Response',
		offerVersion: 1,
		schoolActivations: ['00100', '00200', '00300'],
	};
});
