import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { MetaTagExtractorService } from './meta-tag-extractor.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';

jest.mock('open-graph-scraper', () => {
	return {
		__esModule: true,
		default: jest.fn(),
	};
});

const mockOgsResolve = (result: Record<any, any>) => {
	const mockedOgs = ogs as jest.Mock;
	mockedOgs.mockResolvedValueOnce({
		error: false,
		html: '',
		response: {},
		result,
	});
};

const mockOgsReject = (error: Error) => {
	const mockedOgs = ogs as jest.Mock;
	mockedOgs.mockRejectedValueOnce(error);
};

describe(MetaTagExtractorService.name, () => {
	let module: TestingModule;
	let metaTagInternalUrlService: DeepMocked<MetaTagInternalUrlService>;
	let service: MetaTagExtractorService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MetaTagExtractorService,
				{
					provide: MetaTagInternalUrlService,
					useValue: createMock<MetaTagInternalUrlService>(),
				},
			],
		}).compile();

		metaTagInternalUrlService = module.get(MetaTagInternalUrlService);
		service = module.get(MetaTagExtractorService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		Configuration.set('SC_DOMAIN', 'localhost');
		metaTagInternalUrlService.tryInternalLinkMetaTags.mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('create', () => {
		describe('when url points to webpage', () => {
			it('should thrown an error if url is an empty string', async () => {
				const url = '';

				await expect(service.getMetaData(url)).rejects.toThrow();
			});

			it('should return also the original url', async () => {
				const ogTitle = 'My Title';
				const url = 'https://de.wikipedia.org';
				mockOgsResolve({ url, ogTitle });

				const result = await service.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ url }));
			});

			it('should return ogTitle as title', async () => {
				const ogTitle = 'My Title';
				const url = 'https://de.wikipedia.org';
				mockOgsResolve({ ogTitle });

				const result = await service.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: ogTitle }));
			});

			it('should return ogImage as image', async () => {
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
				mockOgsResolve({ url, ogImage });

				const result = await service.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ image: ogImage[1] }));
			});
		});

		describe('when url points to a file', () => {
			it('should return filename as title', async () => {
				const url = 'https://de.wikipedia.org/abc.jpg';

				mockOgsReject(new Error('no open graph data included... probably not a webpage'));

				const result = await service.getMetaData(url);
				expect(result).toEqual(expect.objectContaining({ title: 'abc.jpg' }));
			});
		});

		describe('when url is invalid', () => {
			it('should return url as it is', async () => {
				const url = 'not-a-real-domain';

				mockOgsReject(new Error('no open graph data included... probably not a webpage'));

				const result = await service.getMetaData(url);
				expect(result).toEqual(expect.objectContaining({ url, title: '', description: '' }));
			});
		});
	});
});
