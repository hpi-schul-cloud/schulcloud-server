import { faker } from '@faker-js/faker';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { MetaDataEntityType, MetaTagExtractorApi, type MetaTagExtractorResponse } from '../generated';
import { AdapterUtils } from './adapter.utils';
import { MetaTagsClientAdapter } from './meta-tags-client.adapter';

describe(MetaTagsClientAdapter.name, () => {
	let module: TestingModule;
	let sut: MetaTagsClientAdapter;
	let metaTagExtractorApi: DeepMocked<MetaTagExtractorApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MetaTagsClientAdapter, { provide: MetaTagExtractorApi, useValue: createMock<MetaTagExtractorApi>() }],
		}).compile();

		sut = module.get(MetaTagsClientAdapter);
		metaTagExtractorApi = module.get(MetaTagExtractorApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetaTags', () => {
		describe('when the server returns the meta tags of a page', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const url = faker.internet.url();
				const metaTags: MetaTagExtractorResponse = {
					url,
					title: faker.lorem.words(),
					description: faker.lorem.sentence(),
					type: MetaDataEntityType.EXTERNAL,
				};

				metaTagExtractorApi.metaTagExtractorControllerGetMetaTags.mockResolvedValueOnce(
					axiosResponseFactory.build({ data: metaTags })
				);

				return { jwt, url, metaTags };
			};

			it('should send the address with the token of the user', async () => {
				const { jwt, url } = setup();

				await sut.getMetaTags(jwt, url);

				expect(metaTagExtractorApi.metaTagExtractorControllerGetMetaTags).toHaveBeenCalledWith(
					{ url },
					AdapterUtils.createAxiosConfigForJwt(jwt)
				);
			});

			it('should return the meta tags', async () => {
				const { jwt, url, metaTags } = setup();

				const result = await sut.getMetaTags(jwt, url);

				expect(result).toEqual(metaTags);
			});
		});
	});
});
