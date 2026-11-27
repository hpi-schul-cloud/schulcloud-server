import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { of } from 'rxjs';
import { BOARD_IMPORT_SERVER_API_CONFIG_TOKEN, type BoardImportServerApiConfig } from '../../board-import.config';
import { BoardImportServerClientService } from './board-import-server-client.service';

describe(BoardImportServerClientService.name, () => {
	let module: TestingModule;
	let service: BoardImportServerClientService;
	let httpService: DeepMocked<HttpService>;

	const config: BoardImportServerApiConfig = { basePath: 'http://server.example/api' };

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportServerClientService,
				{ provide: HttpService, useValue: createMock<HttpService>() },
				{ provide: BOARD_IMPORT_SERVER_API_CONFIG_TOKEN, useValue: config },
			],
		}).compile();

		service = module.get(BoardImportServerClientService);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getInstanceFeatures', () => {
		describe('when the public config has the switch for the link element', () => {
			const setup = () => {
				const linkElementEnabled = false;
				const data = { FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: linkElementEnabled };
				const url = `${config.basePath}/v3/config/public`;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data })));

				return { linkElementEnabled, url };
			};

			it('should read the public config of the server', async () => {
				const { url } = setup();

				await service.getInstanceFeatures();

				expect(httpService.get).toHaveBeenCalledWith(url, expect.anything());
			});

			it('should return the value of the switch', async () => {
				const { linkElementEnabled } = setup();

				const result = await service.getInstanceFeatures();

				expect(result).toEqual({ linkElementEnabled });
			});
		});

		describe('when the public config has no switch for the link element', () => {
			const setup = () => {
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: 'not a config' })));
			};

			it('should reject', async () => {
				setup();

				await expect(service.getInstanceFeatures()).rejects.toThrow();
			});
		});
	});

	describe('getLinkMetaTags', () => {
		describe('when the server returns the meta tags of the page', () => {
			const setup = () => {
				const jwt = 'token';
				const linkUrl = 'https://example.com/page';
				const metaTags = {
					title: 'Page',
					description: 'Description',
					originalImageUrl: 'https://example.com/image.png',
				};
				const url = `${config.basePath}/v3/meta-tag-extractor`;
				const headers = { Authorization: `Bearer ${jwt}` };

				httpService.post.mockReturnValueOnce(
					of(axiosResponseFactory.build({ data: { ...metaTags, url: linkUrl, type: 'external' } }))
				);

				return { jwt, linkUrl, metaTags, url, headers };
			};

			it('should send the address with the token of the user', async () => {
				const { jwt, linkUrl, url, headers } = setup();

				await service.getLinkMetaTags(jwt, linkUrl);

				expect(httpService.post).toHaveBeenCalledWith(url, { url: linkUrl }, expect.objectContaining({ headers }));
			});

			it('should return the title, the description and the address of the image', async () => {
				const { jwt, linkUrl, metaTags } = setup();

				const result = await service.getLinkMetaTags(jwt, linkUrl);

				expect(result).toEqual(metaTags);
			});
		});

		describe('when the answer has no usable meta tags', () => {
			const setup = () => {
				const expectedMetaTags = { title: '', description: '', originalImageUrl: undefined };

				httpService.post.mockReturnValueOnce(
					of(axiosResponseFactory.build({ data: { title: 1, description: null, originalImageUrl: '' } }))
				);

				return { expectedMetaTags };
			};

			it('should return empty texts and no image', async () => {
				const { expectedMetaTags } = setup();

				const result = await service.getLinkMetaTags('token', 'https://example.com');

				expect(result).toEqual(expectedMetaTags);
			});
		});
	});
});
