import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted, EntityId } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { PermissionContexts } from '../files-storage.const';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const createRequestParams = (schoolId: EntityId, userId: EntityId) => {
	return {
		schoolId,
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
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

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

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.deleteFilesOfParent.mockResolvedValueOnce(mockedResult);

				return { params, userId, mockedResult, requestParams };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { userId, requestParams } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					requestParams.parentId,
					PermissionContexts.delete
				);
			});

			it('should call service with correct params', async () => {
				const { requestParams, userId } = setup();

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledWith(requestParams);
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

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

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
				const { requestParams, userId } = createParams();
				const error = new Error('test');

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.delete.mockResolvedValueOnce();

				return { requestParams, userId, fileRecord };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { requestParams, userId, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					PermissionContexts.delete
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
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
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
