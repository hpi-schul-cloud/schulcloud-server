import { OfferDTO } from '@infra/vidis-client';
import { base64TestLogo } from '@modules/tool/external-tool/testing';
import { Factory } from 'fishery';

export const vidisOfferItemFactory = Factory.define<OfferDTO>(({ sequence }) => {
	return {
		offerId: sequence,
		schoolActivations: [
			{ date: '01-01-2025', regionName: '00100' },
			{ date: '01-01-2025', regionName: '00200' },
			{ date: '01-01-2025', regionName: '00300' },
		],
		offerDescription: `Test Description ${sequence}`,
		offerTitle: `VIDIS Test ${sequence}`,
		offerLongTitle: `VIDIS Offer Item Test ${sequence}`,
		offerVersion: 1,
		offerLogo: base64TestLogo,
		educationProviderOrganizationName: `Test Provider ${sequence}`,
	};
});
