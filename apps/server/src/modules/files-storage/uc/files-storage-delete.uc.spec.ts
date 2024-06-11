import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationReferenceService } from '@modules/authorization/domain';
import { InstanceService } from '@modules/instance';
import { SchoolService } from '@modules/school';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, EntityId } from '@shared/domain/types';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { DomainErrorHandler } from '@src/core';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, StorageLocation } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const createRequestParams = (storageLocationId: EntityId, userId: EntityId): FileRecordParams => {
	return {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};
};

const createParams = () => {
	const userId: EntityId = new ObjectId().toHexString();
	const schoolId: EntityId = new ObjectId().toHexString();
	const requestParams = createRequestParams(schoolId, userId);

	return { userId, schoolId, requestParams };
};

describe('FilesStorageUC delete methods', () => {
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
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
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

	describe('deleteFilesOfParent is called', () => {
		describe('WHEN user is authorized and service deletes successful', () => {
			const setup = () => {
				const { params, userId, fileRecords } = buildFileRecordsWithParams();
				const { requestParams } = createParams();
				const fileRecord = fileRecords[0];
				const mockedResult = [[fileRecord], 0] as Counted<FileRecord[]>;

				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce(mockedResult);

				return { params, userId, mockedResult, requestParams, fileRecord };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { userId, requestParams } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(authorizationReferenceService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					requestParams.parentId,
					FileStorageAuthorizationContext.delete
				);
			});

			it('should call service with correct params', async () => {
				const { requestParams, userId, fileRecord } = setup();

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledWith([fileRecord]);
			});

			it('should call deletePreviews', async () => {
				const { requestParams, userId, fileRecord } = setup();

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(previewService.deletePreviews).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return results of service', async () => {
				const { params, userId, mockedResult } = setup();

				const result = await filesStorageUC.deleteFilesOfParent(userId, params);

				expect(result).toEqual(mockedResult);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { requestParams, userId } = createParams();

				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams, userId };
			};

			it('should throw forbidden error', async () => {
				const { requestParams, userId } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId, requestParams)).rejects.toThrow(
					new ForbiddenException()
				);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();

				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				const { requestParams, userId } = createParams();
				const error = new Error('test');

				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				filesStorageService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should return error of service', async () => {
				const { requestParams, userId, error } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId, requestParams)).rejects.toThrow(error);
			});
		});
	});

	describe('deleteOneFile is called', () => {
		describe('WHEN user is authorized, file is found and delete was successful ', () => {
			const setup = () => {
				const { fileRecords, userId } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id, parentType: fileRecord.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.delete.mockResolvedValueOnce();

				return { requestParams, userId, fileRecord };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { requestParams, userId, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				expect(authorizationReferenceService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					FileStorageAuthorizationContext.delete
				);
			});

			it('should call getFile once', async () => {
				const { userId, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledTimes(1);
			});

			it('should call getFile with correctly params', async () => {
				const { userId, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(requestParams);
			});

			it('should call delete with correct params', async () => {
				const { userId, requestParams, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.delete).toHaveBeenCalledWith([fileRecord]);
			});

			it('should call deletePreviews', async () => {
				const { userId, requestParams, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(previewService.deletePreviews).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return fileRecord', async () => {
				const { userId, requestParams, fileRecord } = setup();

				const result = await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN file is not found', () => {
			const setup = () => {
				const { fileRecords, userId } = buildFileRecordsWithParams();
				const requestParams = { fileRecordId: fileRecords[0].id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should throw error if entity not found', async () => {
				const { userId, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecords, userId } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id, parentType: fileRecord.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams, userId };
			};

			it('should throw forbidden exception', async () => {
				const { requestParams, userId } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.delete).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN delete throws error', () => {
			const setup = () => {
				const { fileRecords, userId } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.delete.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should throw error', async () => {
				const { userId, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(error);
			});
		});
	});
});
