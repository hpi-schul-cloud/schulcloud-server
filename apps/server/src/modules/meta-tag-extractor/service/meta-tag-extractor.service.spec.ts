import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { MetaTagExtractorService } from './meta-tag-extractor.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';
import { MetaTagExternalUrlService } from './meta-tag-external-url.service';

jest.mock('open-graph-scraper', () => {
	return {
		__esModule: true,
		default: jest.fn(),
	};
});

describe(MetaTagExtractorService.name, () => {
	let module: TestingModule;
	let metaTagInternalUrlService: DeepMocked<MetaTagInternalUrlService>;
	let metaTagExternalUrlService: DeepMocked<MetaTagExternalUrlService>;
	let service: MetaTagExtractorService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MetaTagExtractorService,
				{
					provide: MetaTagInternalUrlService,
					useValue: createMock<MetaTagInternalUrlService>(),
				},
				{
					provide: MetaTagExternalUrlService,
					useValue: createMock<MetaTagInternalUrlService>(),
				},
			],
		}).compile();

		metaTagInternalUrlService = module.get(MetaTagInternalUrlService);
		metaTagExternalUrlService = module.get(MetaTagExternalUrlService);
		service = module.get(MetaTagExtractorService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		Configuration.set('SC_DOMAIN', 'localhost');
		metaTagInternalUrlService.tryInternalLinkMetaTags.mockResolvedValue(undefined);
		metaTagExternalUrlService.tryExtractMetaTags.mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetaData', () => {
		describe('when protocol is not https', () => {
			it('should throw an error', async () => {
				const url = 'http://www.test.de';

				await expect(service.getMetaData(url)).rejects.toThrowError(`Invalid URL`);
			});
		});

		describe('when it is not an internal link', () => {
			describe('when no meta tags were found', () => {
				it('should return a MetaData object with type unknown', async () => {
					const url = 'https://www.test.de/super.pdf';

					const result = await service.getMetaData(url);

					expect(result).toEqual({
						url,
						title: 'super.pdf',
						description: '',
						type: 'unknown',
					});
				});
			});
		});

		describe('when url hostname contains IP-Adress', () => {
			it.each([
				{ url: 'https://127.0.0.1' },
				{ url: 'https://127.0.0.1:8000' },
				{ url: 'https://127.0.0.1:3000/dashboard' },
				{ url: 'https://FE80:CD00:0000:0CDE:1257:0000:211E:729C' },
				{ url: 'https://FE80:CD00:0000:0CDE:1257:0000:211E:729C:8000' },
				{ url: 'https://FE80:CD00:0000:0CDE:1257:0000:211E:729C:8000/course' },
			])('should return undefined for $url ', async ({ url }) => {
				await expect(async () => service.getMetaData(url)).rejects.toThrow();
			});
		});
	});
});
