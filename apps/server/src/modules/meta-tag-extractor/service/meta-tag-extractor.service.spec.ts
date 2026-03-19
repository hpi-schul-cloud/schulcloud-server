import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MetaDataEntityType } from '../types';
import { MetaTagExternalUrlService } from './meta-tag-external-url.service';
import { MetaTagExtractorService } from './meta-tag-extractor.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';
import { META_TAG_EXTRACTOR_CONFIG_TOKEN } from '../meta-tag-extractor.config';

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
				{
					provide: META_TAG_EXTRACTOR_CONFIG_TOKEN,
					useValue: {
						scDomain: 'localhost',
					},
				},
			],
		}).compile();

		metaTagInternalUrlService = module.get(MetaTagInternalUrlService);
		metaTagExternalUrlService = module.get(MetaTagExternalUrlService);
		service = module.get(MetaTagExtractorService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		metaTagInternalUrlService.tryInternalLinkMetaTags.mockResolvedValue(undefined);
		metaTagExternalUrlService.tryExtractMetaTags.mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetaData', () => {
		describe('when url is an empty string', () => {
			it('should throw an error', async () => {
				const url = '';

				await expect(async () => service.getMetaData(url)).rejects.toThrow();
			});
		});

		describe('when protocol is not https', () => {
			it('should fix it', async () => {
				const url = 'http://www.test.de';

				const metaData = await service.getMetaData(url);

				expect(metaData).toEqual(expect.objectContaining({ url: 'https://www.test.de/' }));
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
						type: MetaDataEntityType.UNKNOWN,
					});
				});
			});
		});

		describe('when it is an external url', () => {
			describe('when no meta tags were found', () => {
				it('should return a MetaData object with type unknown', async () => {
					const url = 'https://docs.dbildungscloud.de/display/DBH/Arc+Weekly+Meetings';

					const result = await service.getMetaData(url);

					expect(result).toEqual({
						url,
						title: 'Arc+Weekly+Meetings',
						description: '',
						type: MetaDataEntityType.UNKNOWN,
					});
				});
			});

			describe('when meta tags were found', () => {
				it('should return a MetaData object with type external', async () => {
					const url = 'https://www.test.de/super.pdf';
					const metaData = {
						url,
						title: 'Super Title',
						description: 'Super Description',
						originalImageUrl: 'https://www.test.de/super.jpg',
						type: MetaDataEntityType.EXTERNAL,
					};
					metaTagExternalUrlService.tryExtractMetaTags.mockResolvedValue(metaData);

					const result = await service.getMetaData(url);

					expect(result).toEqual(metaData);
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
