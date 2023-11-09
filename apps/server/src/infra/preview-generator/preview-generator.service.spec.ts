import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { GetFile, S3ClientAdapter } from '@infra/s3-client';
import { Logger } from '@src/core/logger';
import { Readable } from 'node:stream';
import { PreviewGeneratorService } from './preview-generator.service';

const streamMock = jest.fn();
const resizeMock = jest.fn();
const imageMagickMock = () => {
	return { stream: streamMock, resize: resizeMock, data: Readable.from('text') };
};
jest.mock('gm', () => {
	return {
		subClass: () => imageMagickMock,
	};
});

const createFile = (contentRange?: string): GetFile => {
	const text = 'testText';
	const readable = Readable.from(text);

	const fileResponse = {
		data: readable,
		contentType: 'image/jpeg',
		contentLength: text.length,
		contentRange,
		etag: 'testTag',
	};

	return fileResponse;
};

describe('PreviewGeneratorService', () => {
	let module: TestingModule;
	let service: PreviewGeneratorService;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PreviewGeneratorService,
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(PreviewGeneratorService);
		s3ClientAdapter = module.get(S3ClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('generatePreview', () => {
		const setup = (width = 500) => {
			const params = {
				originFilePath: 'file/test.jpeg',
				previewFilePath: 'preview/text.webp',
				previewOptions: {
					format: 'webp',
					width,
				},
			};
			const originFile = createFile();
			s3ClientAdapter.get.mockResolvedValueOnce(originFile);

			const data = Readable.from('text');
			streamMock.mockReturnValueOnce(data);

			const expectedFileData = {
				data,
				mimeType: params.previewOptions.format,
			};

			return { params, originFile, expectedFileData };
		};

		describe('WHEN download of original and preview file is successful', () => {
			it('should call storageClient get method with originFilePath', async () => {
				const { params } = setup();

				await service.generatePreview(params);

				expect(s3ClientAdapter.get).toBeCalledWith(params.originFilePath);
			});

			it('should call imagemagicks resize method', async () => {
				const { params } = setup();

				await service.generatePreview(params);

				expect(resizeMock).toHaveBeenCalledWith(params.previewOptions.width, undefined, '>');
				expect(resizeMock).toHaveBeenCalledTimes(1);
			});

			it('should call imagemagicks stream method', async () => {
				const { params } = setup();

				await service.generatePreview(params);

				expect(streamMock).toHaveBeenCalledWith(params.previewOptions.format);
				expect(streamMock).toHaveBeenCalledTimes(1);
			});

			it('should call S3ClientAdapters create method', async () => {
				const { params, expectedFileData } = setup();

				await service.generatePreview(params);

				expect(s3ClientAdapter.create).toHaveBeenCalledWith(params.previewFilePath, expectedFileData);
				expect(s3ClientAdapter.create).toHaveBeenCalledTimes(1);
			});

			it('should should return values', async () => {
				const { params } = setup();
				const expectedValue = { previewFilePath: params.previewFilePath, status: true };

				const result = await service.generatePreview(params);

				expect(result).toEqual(expectedValue);
			});
		});

		describe('WHEN previewParams.width not set', () => {
			it('should not call imagemagicks resize method', async () => {
				const { params } = setup(0);

				await service.generatePreview(params);

				expect(resizeMock).not.toHaveBeenCalledWith(params.previewOptions.width, undefined, '>');
				expect(resizeMock).not.toHaveBeenCalledTimes(1);
			});
		});
	});
});
