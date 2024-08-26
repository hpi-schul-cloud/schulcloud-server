import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { DomainErrorHandler } from '@src/core';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams, SingleFileParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FileRecordParentType, StorageLocation } from '../interface';
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
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

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
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
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
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
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
				const { params, fileRecords } = buildFileRecordsWithParams();

				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				filesStorageService.restoreFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { params } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);

				await filesStorageUC.restoreFilesOfParent(params);

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					allowedType,
					params.parentId,
					FileStorageAuthorizationContext.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params } = setup();

				await filesStorageUC.restoreFilesOfParent(params);

				expect(filesStorageService.restoreFilesOfParent).toHaveBeenCalledWith(params);
			});

			it('should return counted result', async () => {
				const { params, fileRecords } = setup();

				const result = await filesStorageUC.restoreFilesOfParent(params);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params } = buildFileRecordsWithParams();
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { params };
			};

			it('should throw forbidden error', async () => {
				const { params } = setup();
				await expect(filesStorageUC.restoreFilesOfParent(params)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { params } = buildFileRecordsWithParams();
				const error = new Error('test');

				filesStorageService.restoreFilesOfParent.mockRejectedValueOnce(error);

				return { params, error };
			};

			it('should return error of service', async () => {
				const { params, error } = setup();

				await expect(filesStorageUC.restoreFilesOfParent(params)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreOneFile is called', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params, fileRecord } = buildFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				filesStorageService.restore.mockResolvedValueOnce();

				return { params, fileRecord };
			};

			it('should call filesStorageService.getMarkForDeletedFile with right parameters', async () => {
				const { params } = setup();

				await filesStorageUC.restoreOneFile(params);

				expect(filesStorageService.getFileRecordMarkedForDelete).toHaveBeenCalledWith(params);
			});

			it('should call authorisation with right parameters', async () => {
				const { params, fileRecord } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord.parentType);

				await filesStorageUC.restoreOneFile(params);

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					allowedType,
					fileRecord.parentId,
					FileStorageAuthorizationContext.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params, fileRecord } = setup();

				await filesStorageUC.restoreOneFile(params);

				expect(filesStorageService.restore).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return counted result', async () => {
				const { params, fileRecord } = setup();

				const result = await filesStorageUC.restoreOneFile(params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params, fileRecord } = buildFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { params };
			};

			it('should throw forbidden error', async () => {
				const { params } = setup();

				await expect(filesStorageUC.restoreOneFile(params)).rejects.toThrow(new ForbiddenException());

				expect(filesStorageService.restore).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service getMarkForDeletedFile throws an error', () => {
			const setup = () => {
				const { params } = buildFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockRejectedValueOnce(error);

				return { params, error };
			};

			it('should return error of service', async () => {
				const { params, error } = setup();

				await expect(filesStorageUC.restoreOneFile(params)).rejects.toThrow(error);
			});
		});

		describe('WHEN service restore throws an error', () => {
			const setup = () => {
				const { params, fileRecord } = buildFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				filesStorageService.restore.mockRejectedValueOnce(error);

				return { params, error };
			};

			it('should return error of service', async () => {
				const { params, error } = setup();

				await expect(filesStorageUC.restoreOneFile(params)).rejects.toThrow(error);
			});
		});
	});
});
