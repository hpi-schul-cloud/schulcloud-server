import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { CopyFileResponseBuilder } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
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

const createTargetParams = () => {
	const targetParentId: EntityId = new ObjectId().toHexString();
	const schoolId: EntityId = new ObjectId().toHexString();

	return {
		target: {
			schoolId,
			parentId: targetParentId,
			parentType: FileRecordParentType.Task,
		},
	};
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeEach(() => {
		jest.resetAllMocks();
	});

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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationService = module.get(AuthorizationService);
		filesStorageService = module.get(FilesStorageService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('copyFilesOfParent is called', () => {
		describe('WHEN user has all permissions and service copies files successfully', () => {
			const setup = () => {
				const { params: sourceParams, userId, fileRecords } = buildFileRecordsWithParams();
				const targetParams = createTargetParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				const fileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockResolvedValueOnce([[fileResponse], 1]);

				return { sourceParams, targetParams, userId, fileResponse };
			};

			it('should call authorizationService.checkPermissionByReferences by source params', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId,
					sourceParams.parentType,
					sourceParams.parentId,
					{ action: Action.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences by copyFilesParams', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId,
					targetParams.target.parentType,
					targetParams.target.parentId,
					{ action: Action.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call service with correct params', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledWith(userId, sourceParams, targetParams);
			});

			it('should return copied files responses', async () => {
				const { sourceParams, targetParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(result).toEqual([[fileResponse], 1]);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = createParams();
				const targetParams = createTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = createParams();
				const targetParams = createTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = createParams();
				const targetParams = createTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service copy throws error', () => {
			const setup = () => {
				const { params: sourceParams, userId } = buildFileRecordsWithParams();
				const targetParams = createTargetParams();

				const error = new Error('test');

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should pass error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
			});
		});
	});

	describe('copyOneFile is called', () => {
		const createParamsForCopyOneFile = () => {
			const { userId, fileRecords } = buildFileRecordsWithParams();
			const targetParams = createTargetParams();
			const fileRecord = fileRecords[0];

			const fileRecordId: EntityId = new ObjectId().toHexString();
			const singleFileParams = {
				fileRecordId,
			};
			const copyFileParams = { ...targetParams, fileNamePrefix: 'copy from' };

			return { singleFileParams, copyFileParams, userId, fileRecord };
		};

		describe('WHEN user has permisson and service copies files successfully', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();

				const fileResponse = CopyFileResponseBuilder.build(
					fileRecord.id,
					singleFileParams.fileRecordId,
					fileRecord.name
				);

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockResolvedValueOnce([fileResponse]);

				return { singleFileParams, copyFileParams, userId, fileResponse, fileRecord };
			};

			it('should call getFileRecord with correct params', async () => {
				const { copyFileParams, singleFileParams, userId } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(singleFileParams);
			});

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId, fileRecord } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Action.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences with copyFilesParams', async () => {
				const { copyFileParams, singleFileParams, userId } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId,
					copyFileParams.target.parentType,
					copyFileParams.target.parentId,
					{ action: Action.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call service with correct params', async () => {
				const { copyFileParams, singleFileParams, userId, fileRecord } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(filesStorageService.copy).toHaveBeenCalledWith(userId, [fileRecord], copyFileParams.target);
			});

			it('should return copied files responses', async () => {
				const { copyFileParams, singleFileParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN find source file throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);

				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = createParamsForCopyOneFile();

				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should pass error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
			});
		});
	});
});
