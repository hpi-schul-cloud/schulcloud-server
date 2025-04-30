import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	FilesStorageService,
	PreviewFileParams,
	PreviewOutputMimeTypes,
	PreviewService,
	PreviewWidth,
} from '../../domain';
import { fileRecordTestFactory, GetFileResponseTestFactory } from '../../testing';
import { DownloadFileParams, SingleFileParams } from '../dto';
import { FilesStorageMapper, PreviewBuilder } from '../mapper';
import { FilesStorageUC, FileStorageAuthorizationContext } from './files-storage.uc';

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordTestFactory().build({ parentId: userId, storageLocationId });

	const singleFileParams: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { singleFileParams, fileRecord, userId };
};

const defaultPreviewParams = {
	outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
	forceUpdate: false,
};

const defaultPreviewParamsWithWidth = {
	...defaultPreviewParams,
	width: PreviewWidth.WIDTH_500,
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let previewService: DeepMocked<PreviewService>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
				},
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
				{
					provide: AntivirusService,
					useValue: createMock<AntivirusService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
		filesStorageService = module.get(FilesStorageService);
		previewService = module.get(PreviewService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('downloadPreview is called', () => {
		describe('WHEN preview is returned and user is authorized', () => {
			const setup = () => {
				const bytesRange = undefined;
				const { fileRecord, singleFileParams, userId } = buildFileRecordWithParams();
				const downloadFileParams: DownloadFileParams = { ...singleFileParams, fileName: fileRecord.getName() };
				const previewParams = { ...defaultPreviewParamsWithWidth };
				const format = previewParams.outputFormat.split('/')[1];

				const previewFileResponse = GetFileResponseTestFactory.build();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				previewService.download.mockResolvedValueOnce(previewFileResponse);

				const hash = PreviewBuilder.createPreviewNameHash(fileRecord.id, previewParams);
				const previewPath = fileRecord.createPreviewFilePath(hash);
				const originPath = fileRecord.createPath();

				const previewFileParams: PreviewFileParams = {
					fileRecord,
					previewParams,
					hash,
					originFilePath: originPath,
					previewFilePath: previewPath,
					format,
					bytesRange,
				};

				return { downloadFileParams, previewParams, previewFileParams, userId, fileRecord, previewFileResponse };
			};

			it('should call getFileRecord with correct params', async () => {
				const { downloadFileParams, userId, previewParams } = setup();

				await filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(downloadFileParams.fileRecordId);
			});

			it('should call getPreview with correct params', async () => {
				const { downloadFileParams, userId, previewParams, previewFileParams, fileRecord } = setup();

				await filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams);

				expect(previewService.download).toHaveBeenCalledWith(fileRecord, previewFileParams);
			});

			it('should call checkPermission with correct params', async () => {
				const { downloadFileParams, previewParams, userId, fileRecord } = setup();
				const parentInfo = fileRecord.getParentInfo();

				await filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(parentInfo.parentType);
				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					allowedType,
					parentInfo.parentId,
					FileStorageAuthorizationContext.read
				);
			});

			it('should return correct result', async () => {
				const { downloadFileParams, previewParams, userId, previewFileResponse } = setup();

				const result = await filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams);

				expect(result).toEqual(previewFileResponse);
			});
		});

		describe('WHEN getFileRecord throws error', () => {
			const setup = () => {
				const { fileRecord, singleFileParams, userId } = buildFileRecordWithParams();
				const downloadFileParams = { ...singleFileParams, fileName: fileRecord.getName() };

				const previewParams = { ...defaultPreviewParamsWithWidth };

				const error = new Error('test');
				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { downloadFileParams, previewParams, userId, error };
			};

			it('should pass error', async () => {
				const { downloadFileParams, userId, error, previewParams } = setup();

				await expect(filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecord, singleFileParams, userId } = buildFileRecordWithParams();
				const downloadFileParams = { ...singleFileParams, fileName: fileRecord.getName() };

				const previewParams = { ...defaultPreviewParamsWithWidth };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				const error = new ForbiddenException();
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(error);

				return { downloadFileParams, userId, fileRecord, previewParams, error };
			};

			it('should throw Error', async () => {
				const { downloadFileParams, userId, previewParams, error } = setup();

				await expect(filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN getPreview throws error', () => {
			const setup = () => {
				const { fileRecord, singleFileParams, userId } = buildFileRecordWithParams();
				const downloadFileParams = { ...singleFileParams, fileName: fileRecord.getName() };

				const previewParams = { ...defaultPreviewParamsWithWidth };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				const error = new Error('test');
				previewService.download.mockRejectedValueOnce(error);

				return { downloadFileParams, previewParams, userId, error };
			};

			it('should pass error', async () => {
				const { downloadFileParams, previewParams, userId, error } = setup();

				await expect(filesStorageUC.downloadPreview(userId, downloadFileParams, previewParams)).rejects.toThrow(error);
			});
		});
	});
});
