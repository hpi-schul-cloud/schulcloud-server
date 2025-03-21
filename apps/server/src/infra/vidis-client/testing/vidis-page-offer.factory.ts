import { PageOfferDTO } from '@infra/vidis-client';
import { Factory } from 'fishery';
import { vidisOfferItemFactory } from './vidis-offer-item.factory';

export const vidisPageOfferFactory = Factory.define<PageOfferDTO>(() => {
	return {
		items: vidisOfferItemFactory.buildList(3),
	};
});
