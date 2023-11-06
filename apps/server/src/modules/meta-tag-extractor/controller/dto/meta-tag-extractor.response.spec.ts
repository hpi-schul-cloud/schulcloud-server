import { MetaTagExtractorResponse } from './meta-tag-extractor.response';

describe(MetaTagExtractorResponse.name, () => {
	describe('when creating a error response', () => {
		it('should have basic properties defined', () => {
			const properties: MetaTagExtractorResponse = {
				url: 'https://www.abc.de/my-article',
				title: 'Testbild',
				description: 'Here we describe what this page is about.',
				imageUrl: 'https://www.abc.de/test.png',
			};

			const errorResponse = new MetaTagExtractorResponse(properties);
			expect(errorResponse.url).toEqual(properties.url);
			expect(errorResponse.title).toEqual(properties.title);
			expect(errorResponse.description).toEqual(properties.description);
			expect(errorResponse.imageUrl).toEqual(properties.imageUrl);
		});
	});
});
