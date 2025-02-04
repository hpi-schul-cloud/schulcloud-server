import { OfferDTO } from '@infra/vidis-client';
import { Factory } from 'fishery';

export const vidisOfferFactory = Factory.define<OfferDTO>(({ sequence }) => {
	return {
		offerId: sequence,
		schoolActivations: ['00100', '00200', '00300'],
		offerDescription: 'Test Description',
		offerTitle: 'VIDIS Test',
		offerVersion: 1,
	};
});
