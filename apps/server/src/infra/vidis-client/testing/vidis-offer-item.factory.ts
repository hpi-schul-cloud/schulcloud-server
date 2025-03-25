import { OfferDTO } from '@infra/vidis-client';
import { Factory } from 'fishery';

export const vidisOfferItemFactory = Factory.define<OfferDTO>(({ sequence }) => {
	return {
		offerId: sequence,
		schoolActivations: ['00100', '00200', '00300'],
		offerDescription: `Test Description ${sequence}`,
		offerTitle: `VIDIS Test ${sequence}`,
		offerLongTitle: `VIDIS Offer Item Test ${sequence}`,
		offerVersion: 1,
		offerLogo: btoa(`VIDIS Test Logo ${sequence}`),
		educationProviderOrganizationName: `Test Provider ${sequence}`,
	};
});
