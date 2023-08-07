import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import crypto from 'crypto';
import { Readable } from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { TestHelper } from '../helper/test-helper';
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

const buildFileRecordsWithParams = (mimeType: string) => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();
	const fileRecord = fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt', mimeType });

	const params: FileRecordParams = {
		schoolId: parentSchoolId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecord, parentId };
};

// Move CreateHash to HelperFunction
const createHash = (fileRecordId: string, format?: string, width?: number, height?: number) => {
	const fileParamsString = `${fileRecordId}${width ?? ''}${height ?? ''}${format ?? ''}`;
	const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

	return hash;
};

// Move getFilePath to HelperFunction
const getFilePath = (fileRecord: FileRecord, hash: string): string => {
	const path = ['previews', fileRecord.getSchoolId(), hash].join('/');

	return path;
};

describe('FilesStorageService download method', () => {
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
					provide: S3ClientAdapter,
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
		s3ClientAdapter = module.get(S3ClientAdapter);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getPreview is called', () => {
		describe('WHEN forceUpdate is true', () => {
			describe('WHEN width, height and outputFormat are not set', () => {
				describe('WHEN download of original and preview file is successfull', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const format = mimeType.split('/')[1];
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
						const downloadParams = {
							fileRecordId: fileRecord.id,
							fileName: fileRecord.name,
						};
						const previewParams = { forceUpdate: true };

						const originalFileResponse = TestHelper.createFileResponse();
						fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						const previewFileResponse = FileResponseBuilder.build(previewFile, fileRecord.name);

						const hash = createHash(fileRecord.id);
						const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, mimeType);
						const previewPath = getFilePath(fileRecord, hash);
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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
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

			describe('WHEN width, height and outputFormat are set', () => {
				describe('WHEN download of original and preview file is successfull', () => {
					const setup = () => {
						const bytesRange = 'bytes=0-100';
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
						const downloadParams = {
							fileRecordId: fileRecord.id,
							fileName: fileRecord.name,
						};
						const previewParams = {
							forceUpdate: true,
							width: 100,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const originalFileResponse = TestHelper.createFileResponse();
						fileStorageService.download.mockResolvedValueOnce(originalFileResponse);

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createHash(
							fileRecord.id,
							previewParams.outputFormat,
							previewParams.width,
							previewParams.height
						);
						const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, previewParams.outputFormat);
						const previewPath = getFilePath(fileRecord, hash);

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

						expect(resizeMock).toHaveBeenCalledWith(previewParams.width, previewParams.height);
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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
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
			});
		});

		describe('WHEN forceUpdate is false', () => {
			describe('WHEN width, height and outputFormat are set', () => {
				describe('WHEN S3ClientAdapter get returns already stored preview file', () => {
					const setup = () => {
						const mimeType = 'image/png';
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
						const downloadParams = {
							fileRecordId: fileRecord.id,
							fileName: fileRecord.name,
						};
						const previewParams = {
							forceUpdate: false,
							width: 100,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
						};
						const format = previewParams.outputFormat.split('/')[1];

						const previewFile = TestHelper.createFile();
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						const fileNameWithoutExtension = fileRecord.name.split('.')[0];
						const name = `${fileNameWithoutExtension}.${format}`;
						const previewFileResponse = FileResponseBuilder.build(previewFile, name);

						const hash = createHash(
							fileRecord.id,
							previewParams.outputFormat,
							previewParams.width,
							previewParams.height
						);
						const previewPath = getFilePath(fileRecord, hash);

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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
						const downloadParams = {
							fileRecordId: fileRecord.id,
							fileName: fileRecord.name,
						};
						const previewParams = {
							forceUpdate: false,
							width: 100,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
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

						const hash = createHash(
							fileRecord.id,
							previewParams.outputFormat,
							previewParams.width,
							previewParams.height
						);
						const previewFileDto = FileDtoBuilder.build(hash, previewFile.data, previewParams.outputFormat);
						const previewPath = getFilePath(fileRecord, hash);

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

						expect(resizeMock).toHaveBeenCalledWith(previewParams.width, previewParams.height);
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
						const { fileRecord } = buildFileRecordsWithParams(mimeType);
						const downloadParams = {
							fileRecordId: fileRecord.id,
							fileName: fileRecord.name,
						};
						const previewParams = {
							forceUpdate: false,
							width: 100,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
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
});
