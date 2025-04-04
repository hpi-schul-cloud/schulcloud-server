import { OfferDTO } from '@infra/vidis-client';
import { Factory } from 'fishery';

export const vidisOfferFactory = Factory.define<OfferDTO>(({ sequence }) => {
	return {
		offerId: sequence,
		schoolActivations: [
			{ date: '01-01-2025', regionName: '00100' },
			{ date: '01-01-2025', regionName: '00200' },
			{ date: '01-01-2025', regionName: '00300' },
		],
		offerDescription: 'Test Description',
		offerTitle: 'VIDIS Test',
		offerVersion: 1,
	};
});
