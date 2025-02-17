import { Factory } from 'fishery';
import { BiloMediaQueryDataResponse } from '../response';

export const biloMediaQueryDataResponseFactory = Factory.define<BiloMediaQueryDataResponse>(({ sequence }) => {
	const data: BiloMediaQueryDataResponse = {
		id: `medium-id-${sequence}`,
		title: `medium-title-${sequence}`,
		author: `author-${sequence}`,
		description: `medium-description`,
		publisher: `publisher-${sequence}`,
		cover: {
			href: 'https://mock-bilo-test.de/cover.jpeg',
			rel: 'src',
		},
		coverSmall: {
			href: 'https://mock-bilo-test.de/cover-small.jpeg',
			rel: 'src',
		},
		modified: Date.now(),
	};

	return data;
});
