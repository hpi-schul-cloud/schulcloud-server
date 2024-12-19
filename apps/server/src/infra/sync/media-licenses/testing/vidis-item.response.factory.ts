import { Factory } from 'fishery';
import { VidisItemResponse } from '../response';

export const vidisItemResponseFactory = Factory.define<VidisItemResponse>(({ sequence }) => {
	return {
		offerId: `${sequence}`,
		schoolActivations: ['00100', '00200', '00300'],
		educationProviderOrganizationName: 'Test Org',
		offerDescription: 'Test Description',
		offerLink: 'https://test-link.com/offer',
		offerLogo: 'https://test-link.com/offer/logo.svg',
		offerTitle: 'VIDIS Test',
		offerLongTitle: 'VIDIS Test Response',
		offerVersion: 1,
	};
});
