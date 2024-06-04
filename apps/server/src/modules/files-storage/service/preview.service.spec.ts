import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PreviewProducer } from '@infra/preview-generator';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, ScanStatus, StorageLocation } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createPath, createPreviewDirectoryPath, createPreviewFilePath, createPreviewNameHash } from '../helper';
import { TestHelper } from '../helper/test-helper';
import { PreviewWidth } from '../interface';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';
import { FileResponseBuilder } from '../mapper';
import { FilesStorageService } from './files-storage.service';
import { PreviewService } from './preview.service';

const buildFileRecordWithParams = (mimeType: string, scanStatus?: ScanStatus) => {
	const parentId = new ObjectId().toHexString();
	const parentStorageLocationId = new ObjectId().toHexString();
	const fileRecord = fileRecordFactory.buildWithId({
		parentId,
		storageLocationId: parentStorageLocationId,
		name: 'text.png',
		mimeType,
	});
	fileRecord.securityCheck.status = scanStatus ?? ScanStatus.VERIFIED;

	const params: FileRecordParams = {
		storageLocationId: parentStorageLocationId,
		storageLocation: StorageLocation.SCHOOL,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecord, parentId };
};

const defaultPreviewParams = {
	outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
	forceUpdate: false,
};

const defaultPreviewParamsWithWidth = {
	...defaultPreviewParams,
	width: PreviewWidth.WIDTH_500,
};

describe('PreviewService', () => {
	let module: TestingModule;
	let previewService: PreviewService;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let previewProducer: DeepMocked<PreviewProducer>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				PreviewService,
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
				{
					provide: FILES_STORAGE_S3_CONNECTION,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{ provide: PreviewProducer, useValue: createMock<PreviewProducer>() },
			],
		}).compile();

		previewService = module.get(PreviewService);
		s3ClientAdapter = module.get(FILES_STORAGE_S3_CONNECTION);
		previewProducer = module.get(PreviewProducer);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('download is called', () => {
		describe('WHEN preview is possible', () => {
			describe('WHEN forceUpdate is true', () => {
				describe('WHEN first get of preview file is successfully', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: true,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					it('calls previewProducer.generate with correct params', async () => {
						const { fileRecord, previewParams, bytesRange, originPath, previewPath, format } = setup();

						await previewService.download(fileRecord, previewParams, bytesRange);

						expect(previewProducer.generate).toHaveBeenCalledWith({
							originFilePath: originPath,
							previewFilePath: previewPath,
							previewOptions: { width: previewParams.width, format },
						});
					});

					it('calls S3ClientAdapters get method', async () => {
						const { fileRecord, previewParams, previewPath } = setup();

						await previewService.download(fileRecord, previewParams);

						expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
						expect(s3ClientAdapter.get).toHaveBeenCalledTimes(1);
					});

					it('returns preview file response', async () => {
						const { fileRecord, previewParams, previewFileResponse } = setup();

						const response = await previewService.download(fileRecord, previewParams);

						expect(response).toEqual(previewFileResponse);
					});
				});

				describe('WHEN first get of preview file throws error and second is successfull', () => {
					const setup = (error: Error | NotFoundException) => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: true,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockRejectedValueOnce(error).mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					describe('WHEN error is a NotFoundException', () => {
						it('calls previewProducer.generate with correct params', async () => {
							const notFoundException = new NotFoundException();
							const { fileRecord, previewParams, bytesRange, originPath, previewPath, format } =
								setup(notFoundException);

							await previewService.download(fileRecord, previewParams, bytesRange);

							expect(previewProducer.generate).toHaveBeenCalledWith({
								originFilePath: originPath,
								previewFilePath: previewPath,
								previewOptions: { width: previewParams.width, format },
							});
							expect(previewProducer.generate).toHaveBeenCalledTimes(2);
						});

						it('calls S3ClientAdapters get method', async () => {
							const notFoundException = new NotFoundException();
							const { fileRecord, previewParams, previewPath } = setup(notFoundException);

							await previewService.download(fileRecord, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(2);
						});
					});

					describe('WHEN error is other error', () => {
						it('should pass error', async () => {
							const error = new Error('testError');
							const { fileRecord, previewParams } = setup(error);

							await expect(previewService.download(fileRecord, previewParams)).rejects.toThrow(error);
						});
					});
				});

				describe('WHEN both gets of preview file throw error', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: true,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						const notFoundException = new NotFoundException();
						s3ClientAdapter.get.mockRejectedValueOnce(notFoundException).mockRejectedValueOnce(notFoundException);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					it('should pass error', async () => {
						const { fileRecord, previewParams } = setup();

						await expect(previewService.download(fileRecord, previewParams)).rejects.toThrow();
					});
				});
			});

			describe('WHEN forceUpdate is false', () => {
				describe('WHEN first get of preview file is successfull', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: false,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					it('calls S3ClientAdapters get method', async () => {
						const { fileRecord, previewParams, previewPath } = setup();

						await previewService.download(fileRecord, previewParams);

						expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
						expect(s3ClientAdapter.get).toHaveBeenCalledTimes(1);
					});

					it('returns preview file response', async () => {
						const { fileRecord, previewParams, previewFileResponse } = setup();

						const response = await previewService.download(fileRecord, previewParams);

						expect(response).toEqual(previewFileResponse);
					});

					it('does not call generate', async () => {
						const { fileRecord, previewParams, bytesRange } = setup();

						await previewService.download(fileRecord, previewParams, bytesRange);

						expect(previewProducer.generate).toHaveBeenCalledTimes(0);
					});
				});

				describe('WHEN first get of preview file throws error and second is successfull', () => {
					const setup = (error: Error | NotFoundException) => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: false,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockRejectedValueOnce(error).mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					describe('WHEN error is a NotFoundException', () => {
						it('calls previewProducer.generate with correct params', async () => {
							const notFoundException = new NotFoundException();
							const { fileRecord, previewParams, bytesRange, originPath, previewPath, format } =
								setup(notFoundException);

							await previewService.download(fileRecord, previewParams, bytesRange);

							expect(previewProducer.generate).toHaveBeenCalledWith({
								originFilePath: originPath,
								previewFilePath: previewPath,
								previewOptions: { width: previewParams.width, format },
							});
							expect(previewProducer.generate).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters get method', async () => {
							const notFoundException = new NotFoundException();
							const { fileRecord, previewParams, previewPath } = setup(notFoundException);

							await previewService.download(fileRecord, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(2);
						});
					});

					describe('WHEN error is other error', () => {
						it('should pass error', async () => {
							const error = new Error('testError');
							const { fileRecord, previewParams } = setup(error);

							await expect(previewService.download(fileRecord, previewParams)).rejects.toThrow(error);
						});
					});
				});

				describe('WHEN both gets of preview file throw error', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordWithParams(mimeType);
						const previewParams = {
							...defaultPreviewParamsWithWidth,
							forceUpdate: true,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						const notFoundException = new NotFoundException();
						s3ClientAdapter.get.mockRejectedValueOnce(notFoundException).mockRejectedValueOnce(notFoundException);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createPreviewNameHash(fileRecord.id, previewParams);
						const previewPath = createPreviewFilePath(fileRecord.getStorageLocationId(), hash, fileRecord.id);
						const originPath = createPath(fileRecord.getStorageLocationId(), fileRecord.id);

						return {
							bytesRange,
							fileRecord,
							previewParams,
							format,
							previewPath,
							originPath,
							previewFileResponse,
						};
					};

					it('should pass error', async () => {
						const { fileRecord, previewParams } = setup();

						await expect(previewService.download(fileRecord, previewParams)).rejects.toThrow();
					});
				});
			});
		});

		describe('WHEN preview is not possible', () => {
			describe('WHEN MIME Type is not supported', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'application/zip';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType);
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						previewParams,
						format,
						error,
					};
				};

				it('passes error', async () => {
					const { fileRecord, previewParams, bytesRange, error } = setup();

					await expect(previewService.download(fileRecord, previewParams, bytesRange)).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is pending', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.PENDING);
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						previewParams,
						format,
						error,
					};
				};

				it('passes error', async () => {
					const { fileRecord, previewParams, bytesRange, error } = setup();

					await expect(previewService.download(fileRecord, previewParams, bytesRange)).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is error', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.ERROR);

					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, previewParams, bytesRange, error } = setup();

					await expect(previewService.download(fileRecord, previewParams, bytesRange)).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is blocked', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.BLOCKED);
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, previewParams, bytesRange, error } = setup();

					await expect(previewService.download(fileRecord, previewParams, bytesRange)).rejects.toThrowError(error);
				});
			});
		});
	});

	describe('deletePreviews', () => {
		describe('WHEN deleteDirectory deletes successfully', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams('image/png');
				const previewParams = {
					...defaultPreviewParams,
				};
				const format = previewParams.outputFormat.split('/')[1];
				const directoryPath = createPreviewDirectoryPath(fileRecord.getStorageLocationId(), fileRecord.id);

				return {
					fileRecord,
					previewParams,
					format,
					directoryPath,
				};
			};

			it('calls deleteDirectory with correct params', async () => {
				const { fileRecord, directoryPath } = setup();

				await previewService.deletePreviews([fileRecord]);

				expect(s3ClientAdapter.deleteDirectory).toHaveBeenCalledWith(directoryPath);
			});
		});

		describe('WHEN deleteDirectory throws error', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams('image/png');
				const previewParams = {
					...defaultPreviewParams,
				};
				const format = previewParams.outputFormat.split('/')[1];

				const error = new Error('testError');
				s3ClientAdapter.deleteDirectory.mockRejectedValueOnce(error);

				return {
					fileRecord,
					previewParams,
					format,
					error,
				};
			};

			it('should throw error', async () => {
				const { fileRecord, error } = setup();

				await expect(previewService.deletePreviews([fileRecord])).rejects.toThrowError(error);
			});
		});
	});
});
