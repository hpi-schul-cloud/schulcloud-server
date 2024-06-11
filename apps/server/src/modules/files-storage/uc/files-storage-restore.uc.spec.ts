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
import { InstanceService } from 'apps/server/src/modules/instance';
import { FileRecordParams, SingleFileParams } from '../controller/dto';
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
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, storageLocationId, name: 'text-two.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, storageLocationId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory
		.markedForDelete()
		.buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
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

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN user is authorised and files to restore exist', () => {
			const setup = () => {
				const { params, userId, fileRecords } = buildFileRecordsWithParams();

				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restoreFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, userId, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { params, userId } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);

				await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					params.parentId,
					FileStorageAuthorizationContext.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params, userId } = setup();

				await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(filesStorageService.restoreFilesOfParent).toHaveBeenCalledWith(params);
			});

			it('should return counted result', async () => {
				const { params, userId, fileRecords } = setup();

				const result = await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params, userId } = buildFileRecordsWithParams();
				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params, userId };
			};

			it('should throw forbidden error', async () => {
				const { params, userId } = setup();
				await expect(filesStorageUC.restoreFilesOfParent(userId, params)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { params, userId } = buildFileRecordsWithParams();
				const error = new Error('test');

				filesStorageService.restoreFilesOfParent.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreFilesOfParent(userId, params)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreOneFile is called', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params, userId, fileRecord } = buildFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockResolvedValueOnce();

				return { params, userId, fileRecord };
			};

			it('should call filesStorageService.getMarkForDeletedFile with right parameters', async () => {
				const { params, userId } = setup();

				await filesStorageUC.restoreOneFile(userId, params);

				expect(filesStorageService.getFileRecordMarkedForDelete).toHaveBeenCalledWith(params);
			});

			it('should call authorisation with right parameters', async () => {
				const { params, userId, fileRecord } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord.parentType);

				await filesStorageUC.restoreOneFile(userId, params);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					FileStorageAuthorizationContext.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params, userId, fileRecord } = setup();

				await filesStorageUC.restoreOneFile(userId, params);

				expect(filesStorageService.restore).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return counted result', async () => {
				const { params, userId, fileRecord } = setup();

				const result = await filesStorageUC.restoreOneFile(userId, params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params, userId, fileRecord } = buildFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params, userId };
			};

			it('should throw forbidden error', async () => {
				const { params, userId } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(new ForbiddenException());

				expect(filesStorageService.restore).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service getMarkForDeletedFile throws an error', () => {
			const setup = () => {
				const { params, userId } = buildFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(error);
			});
		});

		describe('WHEN service restore throws an error', () => {
			const setup = () => {
				const { params, userId, fileRecord } = buildFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(error);
			});
		});
	});
});
