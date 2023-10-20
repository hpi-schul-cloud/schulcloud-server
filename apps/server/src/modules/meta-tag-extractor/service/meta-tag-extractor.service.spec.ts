import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { MetaTagExtractorService } from './meta-tag-extractor.service';

let ogsResponseMock = {};
jest.mock(
	'open-graph-scraper',
	() => () =>
		Promise.resolve({
			error: false,
			html: '',
			response: {},
			result: ogsResponseMock,
		})
);

describe(MetaTagExtractorService.name, () => {
	let module: TestingModule;
	let service: MetaTagExtractorService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MetaTagExtractorService],
		}).compile();

		service = module.get(MetaTagExtractorService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('create', () => {
		it('should return also the original url', async () => {
			const url = 'https://de.wikipedia.org';

			const result = await service.fetchMetaData(url);

			expect(result).toEqual(expect.objectContaining({ url }));
		});

		it('should thrown an error if url is an empty string', async () => {
			const url = '';

			await expect(service.fetchMetaData(url)).rejects.toThrow();
		});

		it('should return ogTitle as title', async () => {
			const ogTitle = 'My Title';
			const url = 'https://de.wikipedia.org';
			ogsResponseMock = { ogTitle };

			const result = await service.fetchMetaData(url);

			expect(result).toEqual(expect.objectContaining({ title: ogTitle }));
		});

		it('should return ogImage as title', async () => {
			const ogImage: ImageObject[] = [
				{
					width: 800,
					type: 'jpeg',
					url: 'big-image.jpg',
				},
				{
					width: 500,
					type: 'jpeg',
					url: 'medium-image.jpg',
				},
				{
					width: 300,
					type: 'jpeg',
					url: 'small-image.jpg',
				},
			];
			const url = 'https://de.wikipedia.org';
			ogsResponseMock = { ogImage };

			const result = await service.fetchMetaData(url);

			expect(result).toEqual(expect.objectContaining({ image: ogImage[1] }));
		});
	});
});
