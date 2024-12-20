import { Factory } from 'fishery';
import { PageOfferDTO } from '@infra/vidis-client';
import { vidisOfferItemFactory } from './vidis-offer-item.factory';

export const vidisPageOfferFactory = Factory.define<PageOfferDTO>(() => {
	return {
		items: vidisOfferItemFactory.buildList(3),
	};
});
