import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams, SingleFileParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { PermissionContexts } from '../files-storage.const';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.markedForDelete().buildWithId({ parentId: userId, schoolId, name: 'text.txt' });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationService = module.get(AuthorizationService);
		filesStorageService = module.get(FilesStorageService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN user is authorised and files to restore exist', () => {
			const setup = () => {
				const { params, userId, fileRecords } = buildFileRecordsWithParams();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restoreFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, userId, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { params, userId } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);

				await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					params.parentId,
					PermissionContexts.create
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
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
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

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					PermissionContexts.create
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
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
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
