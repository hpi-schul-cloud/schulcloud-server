import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory, setupEntities } from '@shared/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { LegacyLogger } from '@src/core/logger';
import { DrawingElementAdapterService } from './drawing-element-adapter.service';

describe(DrawingElementAdapterService.name, () => {
	let module: TestingModule;
	let service: DrawingElementAdapterService;
	let httpService: DeepMocked<HttpService>;

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
			],
		}).compile();

		service = module.get(DrawingElementAdapterService);
		httpService = module.get(HttpService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteDrawingBinData', () => {
		describe('when calling the delete drawing method', () => {
			const setup = () => {
				httpService.delete.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);
			};

			it('should call axios delete method', async () => {
				setup();
				await service.deleteDrawingBinData('test');
				expect(httpService.delete).toHaveBeenCalled();
			});
		});
	});
});
