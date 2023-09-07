import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, ScanStatus } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createPreviewDirectoryPath, createPreviewFilePath, createPreviewNameHash } from '../helper';
import { TestHelper } from '../helper/test-helper';
import { PreviewWidth } from '../interface';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';
import { FileDtoBuilder, FileResponseBuilder } from '../mapper';
import { FilesStorageService } from './files-storage.service';
import { PreviewService } from './preview.service';

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

const buildFileRecordWithParams = (mimeType: string, scanStatus?: ScanStatus) => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();
	const fileRecord = fileRecordFactory.buildWithId({
		parentId,
		schoolId: parentSchoolId,
		name: 'text.png',
		mimeType,
	});
	fileRecord.securityCheck.status = scanStatus ?? ScanStatus.VERIFIED;

	const params: FileRecordParams = {
		schoolId: parentSchoolId,
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
	let fileStorageService: DeepMocked<FilesStorageService>;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;

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
			],
		}).compile();

		previewService = module.get(PreviewService);
		fileStorageService = module.get(FilesStorageService);
		s3ClientAdapter = module.get(FILES_STORAGE_S3_CONNECTION);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getPreview is called', () => {
		describe('WHEN preview is possbile', () => {
			describe('WHEN forceUpdate is true', () => {
				describe('WHEN width and outputformat are not set', () => {
					describe('WHEN download of original and preview file is successfull', () => {
						const setup = () => {
							const bytesRange = 'bytes=0-100';
							const orignalMimeType = 'image/png';
							const format = orignalMimeType.split('/')[1];
							const { fileRecord } = buildFileRecordWithParams(orignalMimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = { forceUpdate: true };

							const originalFileResponse = TestHelper.createFileResponse();
							fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

							const previewFile = TestHelper.createFile();
							s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

							const fileNameWithoutExtension = fileRecord.name.split('.')[0];
							const name = `${fileNameWithoutExtension}.${format}`;
							const previewFileResponse = FileResponseBuilder.build(previewFile, name);

							const hash = createPreviewNameHash(fileRecord.id, {});
							const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, orignalMimeType);
							const previewPath = createPreviewFilePath(fileRecord.getSchoolId(), hash, fileRecord.id);
							streamMock.mockClear();
							streamMock.mockReturnValueOnce(previewFileDto.data);

							return {
								bytesRange,
								fileRecord,
								downloadParams,
								previewParams,
								format,
								previewFileDto,
								previewPath,
								previewFileResponse,
							};
						};

						it('calls download with correct params', async () => {
							const { fileRecord, downloadParams, previewParams, bytesRange } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange);

							expect(fileStorageService.download).toHaveBeenCalledWith(fileRecord, downloadParams, bytesRange);
						});

						it('calls image magicks stream method', async () => {
							const { fileRecord, downloadParams, previewParams, format } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(streamMock).toHaveBeenCalledWith(format);
							expect(streamMock).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters create method', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileDto, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.create).toHaveBeenCalledWith(previewPath, previewFileDto);
							expect(s3ClientAdapter.create).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters get method', async () => {
							const { fileRecord, downloadParams, previewParams, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(1);
						});

						it('returns preview file response', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileResponse } = setup();

							const response = await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(response).toEqual(previewFileResponse);
						});
					});

					describe('WHEN download of original file throws error', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = { forceUpdate: true };

							const error = new Error('testError');
							fileStorageService.download.mockRejectedValueOnce(error);

							return { fileRecord, downloadParams, previewParams, error };
						};

						it('passes error', async () => {
							const { fileRecord, downloadParams, previewParams, error } = setup();

							await expect(previewService.getPreview(fileRecord, downloadParams, previewParams)).rejects.toThrowError(
								error
							);
						});
					});

					describe('WHEN create of preview file throws error', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = { forceUpdate: true };

							const originalFileResponse = TestHelper.createFileResponse();
							fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

							const error = new Error('testError');
							s3ClientAdapter.create.mockRejectedValueOnce(error);

							return { fileRecord, downloadParams, previewParams, error };
						};

						it('passes error', async () => {
							const { fileRecord, downloadParams, previewParams, error } = setup();

							await expect(previewService.getPreview(fileRecord, downloadParams, previewParams)).rejects.toThrowError(
								error
							);
						});
					});

					describe('WHEN get of preview file throws error', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = { forceUpdate: true };

							const originalFileResponse = TestHelper.createFileResponse();
							fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

							const error = new Error('testError');
							s3ClientAdapter.get.mockRejectedValueOnce(error);

							return { fileRecord, downloadParams, previewParams, error };
						};

						it('passes error', async () => {
							const { fileRecord, downloadParams, previewParams, error } = setup();

							await expect(previewService.getPreview(fileRecord, downloadParams, previewParams)).rejects.toThrowError(
								error
							);
						});
					});
				});

				describe('WHEN width and outputFormat are set', () => {
					describe('WHEN download of original and preview file is successfull', () => {
						const setup = () => {
							const bytesRange = 'bytes=0-100';
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = {
								...defaultPreviewParamsWithWidth,
								forceUpdate: true,
							};
							const format = previewParams.outputFormat.split('/')[1];

							const originalFileResponse = TestHelper.createFileResponse();
							fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

							const previewFile = TestHelper.createFile();
							s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

							const fileNameWithoutExtension = fileRecord.name.split('.')[0];
							const name = `${fileNameWithoutExtension}.${format}`;
							const previewFileResponse = FileResponseBuilder.build(previewFile, name);

							const hash = createPreviewNameHash(fileRecord.id, previewParams);
							const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, previewParams.outputFormat);
							const previewPath = createPreviewFilePath(fileRecord.getSchoolId(), hash, fileRecord.id);

							streamMock.mockClear();
							streamMock.mockReturnValueOnce(previewFileDto.data);

							resizeMock.mockClear();

							return {
								bytesRange,
								fileRecord,
								downloadParams,
								previewParams,
								format,
								previewFileDto,
								previewPath,
								previewFileResponse,
							};
						};

						it('calls download with correct params', async () => {
							const { fileRecord, downloadParams, previewParams, bytesRange } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange);

							expect(fileStorageService.download).toHaveBeenCalledWith(fileRecord, downloadParams, bytesRange);
						});

						it('calls image magicks resize method', async () => {
							const { fileRecord, downloadParams, previewParams } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(resizeMock).toHaveBeenCalledWith(previewParams.width);
							expect(resizeMock).toHaveBeenCalledTimes(1);
						});

						it('calls image magicks stream method', async () => {
							const { fileRecord, downloadParams, previewParams, format } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(streamMock).toHaveBeenCalledWith(format);
							expect(streamMock).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters create method', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileDto, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.create).toHaveBeenCalledWith(previewPath, previewFileDto);
							expect(s3ClientAdapter.create).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters get method', async () => {
							const { fileRecord, downloadParams, previewParams, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(1);
						});

						it('returns preview file response', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileResponse } = setup();

							const response = await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(response).toEqual(previewFileResponse);
						});
					});

					describe('WHEN download of original file throws error', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = { ...defaultPreviewParams, forceUpdate: true };

							const error = new Error('testError');
							fileStorageService.download.mockRejectedValueOnce(error);

							return { fileRecord, downloadParams, previewParams, error };
						};

						it('passes error', async () => {
							const { fileRecord, downloadParams, previewParams, error } = setup();

							await expect(previewService.getPreview(fileRecord, downloadParams, previewParams)).rejects.toThrowError(
								error
							);
						});
					});
				});
			});

			describe('WHEN forceUpdate is false', () => {
				describe('WHEN width and outputFormat are set', () => {
					describe('WHEN S3ClientAdapter get returns already stored preview file', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = {
								...defaultPreviewParamsWithWidth,
							};
							const format = previewParams.outputFormat.split('/')[1];

							const previewFile = TestHelper.createFile();
							s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

							const fileNameWithoutExtension = fileRecord.name.split('.')[0];
							const name = `${fileNameWithoutExtension}.${format}`;
							const previewFileResponse = FileResponseBuilder.build(previewFile, name);

							const hash = createPreviewNameHash(fileRecord.id, previewParams);
							const previewPath = createPreviewFilePath(fileRecord.getSchoolId(), hash, fileRecord.id);

							resizeMock.mockClear();
							streamMock.mockClear();

							return {
								fileRecord,
								downloadParams,
								previewParams,
								previewPath,
								previewFileResponse,
							};
						};

						it('calls S3ClientAdapters get method', async () => {
							const { fileRecord, downloadParams, previewParams, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(1);
						});

						it('returns preview file response', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileResponse } = setup();

							const response = await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(response).toEqual(previewFileResponse);
						});

						it('does not call image magicks resize and stream method', async () => {
							const { fileRecord, downloadParams, previewParams } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(resizeMock).not.toHaveBeenCalled();
							expect(streamMock).not.toHaveBeenCalled();
						});
					});

					describe('WHEN S3ClientAdapter get throws NotFoundException', () => {
						const setup = () => {
							const bytesRange = 'bytes=0-100';
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = {
								...defaultPreviewParamsWithWidth,
							};
							const format = previewParams.outputFormat.split('/')[1];

							const error = new NotFoundException();
							s3ClientAdapter.get.mockRejectedValueOnce(error);

							const originalFileResponse = TestHelper.createFileResponse();
							fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

							const previewFile = TestHelper.createFile();
							s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

							const fileNameWithoutExtension = fileRecord.name.split('.')[0];
							const name = `${fileNameWithoutExtension}.${format}`;
							const previewFileResponse = FileResponseBuilder.build(previewFile, name);

							const hash = createPreviewNameHash(fileRecord.id, previewParams);
							const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, previewParams.outputFormat);
							const previewPath = createPreviewFilePath(fileRecord.getSchoolId(), hash, fileRecord.id);

							streamMock.mockClear();
							streamMock.mockReturnValueOnce(previewFileDto.data);

							resizeMock.mockClear();

							return {
								bytesRange,
								fileRecord,
								downloadParams,
								previewParams,
								format,
								previewFileDto,
								previewPath,
								previewFileResponse,
							};
						};

						it('calls download with correct params', async () => {
							const { fileRecord, downloadParams, previewParams, bytesRange } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange);

							expect(fileStorageService.download).toHaveBeenCalledWith(fileRecord, downloadParams, bytesRange);
						});

						it('calls image magicks resize method', async () => {
							const { fileRecord, downloadParams, previewParams } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(resizeMock).toHaveBeenCalledWith(previewParams.width);
							expect(resizeMock).toHaveBeenCalledTimes(1);
						});

						it('calls image magicks stream method', async () => {
							const { fileRecord, downloadParams, previewParams, format } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(streamMock).toHaveBeenCalledWith(format);
							expect(streamMock).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters create method', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileDto, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.create).toHaveBeenCalledWith(previewPath, previewFileDto);
							expect(s3ClientAdapter.create).toHaveBeenCalledTimes(1);
						});

						it('calls S3ClientAdapters get method', async () => {
							const { fileRecord, downloadParams, previewParams, previewPath } = setup();

							await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(s3ClientAdapter.get).toHaveBeenCalledWith(previewPath, undefined);
							expect(s3ClientAdapter.get).toHaveBeenCalledTimes(2);
						});

						it('returns preview file response', async () => {
							const { fileRecord, downloadParams, previewParams, previewFileResponse } = setup();

							const response = await previewService.getPreview(fileRecord, downloadParams, previewParams);

							expect(response).toEqual(previewFileResponse);
						});
					});

					describe('WHEN S3ClientAdapter get throws other than NotFoundException', () => {
						const setup = () => {
							const mimeType = 'image/png';
							const { fileRecord } = buildFileRecordWithParams(mimeType);
							const downloadParams = {
								fileRecordId: fileRecord.id,
								fileName: fileRecord.name,
							};
							const previewParams = {
								...defaultPreviewParamsWithWidth,
							};
							const format = previewParams.outputFormat.split('/')[1];

							const error = new Error('testError');
							s3ClientAdapter.get.mockRejectedValueOnce(error);

							return {
								fileRecord,
								downloadParams,
								previewParams,
								format,
								error,
							};
						};

						it('passes error', async () => {
							const { fileRecord, downloadParams, previewParams, error } = setup();

							await expect(previewService.getPreview(fileRecord, downloadParams, previewParams)).rejects.toThrow(error);
						});
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
					const downloadParams = {
						fileRecordId: fileRecord.id,
						fileName: fileRecord.name,
					};
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const originalFileResponse = TestHelper.createFileResponse();
					fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						downloadParams,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, downloadParams, previewParams, bytesRange, error } = setup();

					await expect(
						previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange)
					).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is pending', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.PENDING);
					const downloadParams = {
						fileRecordId: fileRecord.id,
						fileName: fileRecord.name,
					};
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const originalFileResponse = TestHelper.createFileResponse();
					fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						downloadParams,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, downloadParams, previewParams, bytesRange, error } = setup();

					await expect(
						previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange)
					).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is error', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.ERROR);
					const downloadParams = {
						fileRecordId: fileRecord.id,
						fileName: fileRecord.name,
					};
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const originalFileResponse = TestHelper.createFileResponse();
					fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						downloadParams,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, downloadParams, previewParams, bytesRange, error } = setup();

					await expect(
						previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange)
					).rejects.toThrowError(error);
				});
			});

			describe('WHEN scan status is blocked', () => {
				const setup = () => {
					const bytesRange = 'bytes=0-100';
					const mimeType = 'image/png';
					const format = mimeType.split('/')[1];
					const { fileRecord } = buildFileRecordWithParams(mimeType, ScanStatus.BLOCKED);
					const downloadParams = {
						fileRecordId: fileRecord.id,
						fileName: fileRecord.name,
					};
					const previewParams = { ...defaultPreviewParams, forceUpdate: true };

					const originalFileResponse = TestHelper.createFileResponse();
					fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

					const error = new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);

					return {
						bytesRange,
						fileRecord,
						downloadParams,
						previewParams,
						format,
						error,
					};
				};

				it('calls download with correct params', async () => {
					const { fileRecord, downloadParams, previewParams, bytesRange, error } = setup();

					await expect(
						previewService.getPreview(fileRecord, downloadParams, previewParams, bytesRange)
					).rejects.toThrowError(error);
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
				const directoryPath = createPreviewDirectoryPath(fileRecord.schoolId, fileRecord.id);

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

			it('does not pass error', async () => {
				const { fileRecord } = setup();

				await previewService.deletePreviews([fileRecord]);
			});
		});
	});
});
