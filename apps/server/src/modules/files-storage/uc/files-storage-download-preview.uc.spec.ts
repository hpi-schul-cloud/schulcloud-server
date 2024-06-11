import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationReferenceService } from '@modules/authorization/domain';
import { SchoolService } from '@modules/school';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { DomainErrorHandler } from '@src/core';
import { LegacyLogger } from '@src/core/logger';
import { InstanceService } from 'apps/server/src/modules/instances';
import { DownloadFileParams, SingleFileParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { TestHelper } from '../helper/test-helper';
import { PreviewOutputMimeTypes } from '../interface';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FileStorageAuthorizationContext } from './files-storage-authorization';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
};

const getPreviewParams = () => {
	return {
		outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
		forceUpdate: true,
	};
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let previewService: DeepMocked<PreviewService>;
	let authorizationReferenceService: DeepMocked<AuthorizationReferenceService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

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
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationReferenceService = module.get(AuthorizationReferenceService);
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
				const { fileRecord, params, userId } = buildFileRecordWithParams();
				const fileDownloadParams: DownloadFileParams = { ...params };
				const singleFileParams = FilesStorageMapper.mapToSingleFileParams(fileDownloadParams);

				const previewParams = getPreviewParams();
				const previewFileResponse = TestHelper.createFileResponse();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				previewService.download.mockResolvedValueOnce(previewFileResponse);

				return { fileDownloadParams, previewParams, userId, fileRecord, singleFileParams, previewFileResponse };
			};

			it('should call getFileRecord with correct params', async () => {
				const { fileDownloadParams, userId, previewParams, singleFileParams } = setup();

				await filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(singleFileParams);
			});

			it('should call getPreview with correct params', async () => {
				const { fileDownloadParams, userId, previewParams, fileRecord } = setup();

				await filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams);

				expect(previewService.download).toHaveBeenCalledWith(fileRecord, previewParams, undefined);
			});

			it('should call checkPermission with correct params', async () => {
				const { fileDownloadParams, previewParams, userId, fileRecord } = setup();

				await filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord.parentType);
				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					FileStorageAuthorizationContext.read()
				);
			});

			it('should return correct result', async () => {
				const { fileDownloadParams, previewParams, userId, previewFileResponse } = setup();

				const result = await filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams);

				expect(result).toEqual(previewFileResponse);
			});
		});

		describe('WHEN getFileRecord throws error', () => {
			const setup = () => {
				const { params, userId } = buildFileRecordWithParams();
				const fileDownloadParams: DownloadFileParams = { ...params };

				const previewParams = getPreviewParams();

				const error = new Error('test');
				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { fileDownloadParams, previewParams, userId, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, userId, error, previewParams } = setup();

				await expect(filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecord, params, userId } = buildFileRecordWithParams();
				const fileDownloadParams: DownloadFileParams = { ...params };

				const previewParams = getPreviewParams();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				const error = new ForbiddenException();
				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { fileDownloadParams, userId, fileRecord, previewParams, error };
			};

			it('should throw Error', async () => {
				const { fileDownloadParams, userId, previewParams, error } = setup();

				await expect(filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN getPreview throws error', () => {
			const setup = () => {
				const { fileRecord, params, userId } = buildFileRecordWithParams();
				const fileDownloadParams: DownloadFileParams = { ...params };

				const previewParams = getPreviewParams();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				const error = new Error('test');
				previewService.download.mockRejectedValueOnce(error);

				return { fileDownloadParams, previewParams, userId, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, previewParams, userId, error } = setup();

				await expect(filesStorageUC.downloadPreview(userId, fileDownloadParams, previewParams)).rejects.toThrow(error);
			});
		});
	});
});
