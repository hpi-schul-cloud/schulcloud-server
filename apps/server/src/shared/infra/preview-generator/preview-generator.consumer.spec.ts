import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { PreviewFileOptions, PreviewResponseMessage } from './interface';
import { PreviewGeneratorConsumer } from './preview-generator.consumer';
import { PreviewGeneratorService } from './preview-generator.service';

describe('PreviewGeneratorConsumer', () => {
	let module: TestingModule;
	let previewGeneratorService: DeepMocked<PreviewGeneratorService>;
	let service: PreviewGeneratorConsumer;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PreviewGeneratorConsumer,
				{
					provide: PreviewGeneratorService,
					useValue: createMock<PreviewGeneratorService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		previewGeneratorService = module.get(PreviewGeneratorService);
		service = module.get(PreviewGeneratorConsumer);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('generatePreview()', () => {
		const setup = () => {
			const payload: PreviewFileOptions = {
				originFilePath: 'file/test.jpeg',
				previewFilePath: 'preview/text.webp',
				previewOptions: {
					format: 'webp',
					width: 500,
				},
			};

			const response: PreviewResponseMessage = {
				previewFilePath: payload.previewFilePath,
				status: true,
			};
			previewGeneratorService.generatePreview.mockResolvedValueOnce(response);

			return { payload, response };
		};

		it('should call previewGeneratorService.generatePreview with payload', async () => {
			const { payload } = setup();

			await service.generatePreview(payload);

			expect(previewGeneratorService.generatePreview).toBeCalledWith(payload);
		});

		it('should return expected value', async () => {
			const { payload, response } = setup();

			const result = await service.generatePreview(payload);

			expect(result).toEqual({ message: response });
		});
	});
});
