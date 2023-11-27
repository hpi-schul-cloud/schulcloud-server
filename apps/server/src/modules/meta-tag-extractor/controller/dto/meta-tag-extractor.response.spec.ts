import { MetaTagExtractorResponse } from './meta-tag-extractor.response';

describe(MetaTagExtractorResponse.name, () => {
	describe('when creating a error response', () => {
		it('should have basic properties defined', () => {
			const properties: MetaTagExtractorResponse = {
				url: 'https://www.abc.de/my-article',
				title: 'Testbild',
				description: 'Here we describe what this page is about.',
				imageUrl: 'https://www.abc.de/test.png',
				type: 'unknown',
				parentTitle: 'Math',
				parentType: 'course',
			};

			const response = new MetaTagExtractorResponse(properties);
			expect(response.url).toEqual(properties.url);
			expect(response.title).toEqual(properties.title);
			expect(response.description).toEqual(properties.description);
			expect(response.imageUrl).toEqual(properties.imageUrl);
			expect(response.type).toEqual(properties.type);
			expect(response.parentTitle).toEqual(properties.parentTitle);
			expect(response.parentType).toEqual(properties.parentType);
		});
	});
});
