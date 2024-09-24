import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { of } from 'rxjs';
import { DrawingElementAdapterService } from './drawing-element-adapter.service';

describe(DrawingElementAdapterService.name, () => {
	let module: TestingModule;
	let service: DrawingElementAdapterService;
	let httpService: DeepMocked<HttpService>;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DrawingElementAdapterService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(DrawingElementAdapterService);
		httpService = module.get(HttpService);
		configService = module.get(ConfigService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteDrawingBinData', () => {
		describe('when WITH_TLDRAW2 env var is true', () => {
			const setup = () => {
				const apiKey = 'a4a20e6a-8036-4603-aba6-378006fedce2';
				const baseUrl = 'http://localhost:3349';
				const WITH_TLDRAW2 = true;

				configService.get.mockReturnValueOnce(baseUrl);
				configService.get.mockReturnValueOnce(WITH_TLDRAW2);
				configService.get.mockReturnValueOnce(apiKey);
				httpService.delete.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);

				return { apiKey, baseUrl };
			};

			it('should call axios delete method', async () => {
				const { apiKey, baseUrl } = setup();

				await service.deleteDrawingBinData('test');

				expect(httpService.delete).toHaveBeenCalledWith(`${baseUrl}/api/tldraw-document/test`, {
					headers: { 'X-Api-Key': apiKey, Accept: 'Application/json' },
				});
			});
		});

		describe('when WITH_TLDRAW2 env var is false', () => {
			const setup = () => {
				const apiKey = 'a4a20e6a-8036-4603-aba6-378006fedce2';
				const baseUrl = 'http://localhost:3349';
				const WITH_TLDRAW2 = false;
				configService.get.mockReturnValueOnce(baseUrl);
				configService.get.mockReturnValueOnce(WITH_TLDRAW2);
				configService.get.mockReturnValueOnce(apiKey);
				httpService.delete.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);

				return { apiKey, baseUrl };
			};

			it('should call axios delete method', async () => {
				const { apiKey, baseUrl } = setup();

				await service.deleteDrawingBinData('test');

				expect(httpService.delete).toHaveBeenCalledWith(`${baseUrl}/api/v3/tldraw-document/test`, {
					headers: { 'X-Api-Key': apiKey, Accept: 'Application/json' },
				});
			});
		});
	});
});
