import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, ScanStatus } from '../entity';
import { createICopyFiles } from '../helper';
import { CopyFileResponseBuilder } from '../mapper';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId: parentSchoolId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, parentId };
};

describe('FilesStorageService copy methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageService,
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: AntivirusService,
					useValue: createMock<AntivirusService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		antivirusService = module.get(AntivirusService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('copyFilesOfParent is called', () => {
		describe('WHEN files exist and copyFiles copied files successfully', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords: sourceFileRecords, params: sourceParams, parentId: userId } = buildFileRecordsWithParams();
				const { fileRecords: targetFileRecords, params } = buildFileRecordsWithParams();
				const copyFilesOfParentParams = { target: params };

				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([sourceFileRecords, sourceFileRecords.length]);
				spy = jest.spyOn(service, 'copy');
				spy.mockResolvedValueOnce(targetFileRecords);

				return { sourceParams, copyFilesOfParentParams, sourceFileRecords, targetFileRecords, userId };
			};

			it('should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { userId, sourceParams, copyFilesOfParentParams } = setup();

				await service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(
					1,
					sourceParams.schoolId,
					sourceParams.parentId
				);
			});

			it('should call copy with correct params', async () => {
				const { userId, sourceParams, copyFilesOfParentParams, sourceFileRecords } = setup();

				await service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams);

				expect(service.copy).toHaveBeenCalledWith(userId, sourceFileRecords, copyFilesOfParentParams.target);
			});

			it('should return file records and count', async () => {
				const { userId, sourceParams, copyFilesOfParentParams, targetFileRecords } = setup();

				const responseData = await service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams);

				expect(responseData[0]).toEqual(targetFileRecords);
				expect(responseData[1]).toEqual(targetFileRecords.length);
			});
		});

		describe('WHEN no file is found', () => {
			const setup = () => {
				const { fileRecords, params: sourceParams, parentId: userId } = buildFileRecordsWithParams();
				const { params } = buildFileRecordsWithParams();
				const copyFilesOfParentParams = { target: params };

				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([[], 0]);

				return { sourceParams, copyFilesOfParentParams, fileRecords, userId };
			};

			it('should return empty response if entities not found', async () => {
				const { userId, sourceParams, copyFilesOfParentParams } = setup();

				const result = await service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams);

				expect(result).toEqual([[], 0]);
			});
		});

		describe('WHEN copy throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords: sourceFileRecords, params: sourceParams, parentId: userId } = buildFileRecordsWithParams();
				const { params } = buildFileRecordsWithParams();
				const copyFilesOfParentParams = { target: params };
				const error = new Error('test');

				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([sourceFileRecords, sourceFileRecords.length]);
				spy = jest.spyOn(service, 'copy');
				spy.mockRejectedValueOnce(error);

				return { sourceParams, copyFilesOfParentParams, userId, error };
			};

			it('should pass error', async () => {
				const { userId, sourceParams, copyFilesOfParentParams, error } = setup();

				await expect(service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams)).rejects.toThrow(error);
			});
		});
	});

	describe('copyFileRecords is called', () => {
		describe('WHEN new fileRecord is saved successfully', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];

				return { sourceFile, userId, params };
			};

			it('should call save with file record', async () => {
				const { userId, sourceFile, params } = setup();

				await service.copyFileRecord(sourceFile, params, userId);

				expect(fileRecordRepo.save).toBeCalledWith(expect.any(FileRecord));
			});
		});

		describe('WHEN save throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const error = new Error('test');

				fileRecordRepo.save.mockRejectedValueOnce(error);

				return { sourceFile, userId, params, error };
			};

			it('should pass error', async () => {
				const { userId, sourceFile, params, error } = setup();

				await expect(service.copyFileRecord(sourceFile, params, userId)).rejects.toThrow(error);
			});
		});
	});

	describe('copyFilesWithRollbackOnError is called', () => {
		describe('WHEN storage client copies file successfully', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				return { sourceFile, targetFile };
			};

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile } = setup();

				await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				const expectedParams = createICopyFiles(sourceFile, targetFile);

				expect(storageClient.copy).toBeCalledWith([expectedParams]);
			});

			it('should return file response', async () => {
				const { sourceFile, targetFile } = setup();

				const result = await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				const expectedFileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);

				expect(result).toEqual(expectedFileResponse);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				storageClient.copy.mockRejectedValueOnce(error);

				return { sourceFile, targetFile, error };
			};

			it('should pass error and delete file record', async () => {
				const { sourceFile, targetFile, error } = setup();

				await expect(service.copyFilesWithRollbackOnError(sourceFile, targetFile)).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toBeCalledWith([targetFile]);
			});
		});

		describe('WHEN source files security status is pending', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.PENDING;
				const targetFile = fileRecords[1];

				return { sourceFile, targetFile };
			};

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile } = setup();

				await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				expect(antivirusService.send).toBeCalledWith(sourceFile);
			});
		});

		describe('WHEN source files security status is VERIFIED', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.VERIFIED;
				const targetFile = fileRecords[1];

				return { sourceFile, targetFile };
			};

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile } = setup();

				await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				expect(antivirusService.send).toBeCalledTimes(0);
			});
		});

		describe('WHEN source files security status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.BLOCKED;
				const targetFile = fileRecords[1];

				return { sourceFile, targetFile };
			};

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile } = setup();

				await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				expect(antivirusService.send).toBeCalledTimes(0);
			});
		});

		describe('WHEN anti virus service throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				antivirusService.send.mockImplementation(() => {
					throw error;
				});

				return { sourceFile, targetFile, error };
			};

			it('should delete file record', async () => {
				const { sourceFile, targetFile, error } = setup();

				await expect(service.copyFilesWithRollbackOnError(sourceFile, targetFile)).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toBeCalledWith([targetFile]);
			});
		});
	});

	describe('copy is called', () => {
		describe('WHEN file records and files copied successfully', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				spy = jest.spyOn(service, 'copyFileRecord').mockResolvedValueOnce(targetFile);

				const fileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);
				spy = jest.spyOn(service, 'copyFilesWithRollbackOnError').mockResolvedValueOnce(fileResponse);

				return { sourceFile, targetFile, userId, params, fileResponse };
			};

			it('should call copyFileRecord with correct params', async () => {
				const { sourceFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				expect(service.copyFileRecord).toHaveBeenCalledWith(sourceFile, params, userId);
			});

			it('should call copyFilesWithRollbackOnError with correct params', async () => {
				const { sourceFile, targetFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				expect(service.copyFilesWithRollbackOnError).toHaveBeenCalledWith(sourceFile, targetFile);
			});

			it('should return file response array', async () => {
				const { sourceFile, params, userId, fileResponse } = setup();

				const result = await service.copy(userId, [sourceFile], params);

				expect(result).toEqual([fileResponse]);
			});
		});

		describe('WHEN source files scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord, userId, params };
			};

			it('should return empty array', async () => {
				const { fileRecord, params, userId } = setup();

				const result = await service.copy(userId, [fileRecord], params);

				expect(result.length).toBe(0);
			});
		});

		describe('WHEN source file is marked for delete', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.deletedSince = new Date();

				return { fileRecord, userId, params };
			};

			it('should return empty array', async () => {
				const { fileRecord, params, userId } = setup();

				const result = await service.copy(userId, [fileRecord], params);

				expect(result.length).toBe(0);
			});
		});

		describe('WHEN one copy file record throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				spy = jest.spyOn(service, 'copyFileRecord');
				spy.mockRejectedValueOnce(error).mockResolvedValueOnce(targetFile);

				const fileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);
				spy = jest.spyOn(service, 'copyFilesWithRollbackOnError').mockResolvedValue(fileResponse);

				return { sourceFile, targetFile, userId, params, fileResponse };
			};

			it('should return one file response', async () => {
				const { sourceFile, params, userId, fileResponse } = setup();

				const result = await service.copy(userId, [sourceFile, sourceFile], params);

				expect(result).toEqual([fileResponse]);
			});
		});

		describe('WHEN one copy files throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				spy = jest.spyOn(service, 'copyFileRecord');
				spy.mockResolvedValue(targetFile);

				const fileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);
				spy = jest.spyOn(service, 'copyFilesWithRollbackOnError');
				spy.mockRejectedValueOnce(error).mockResolvedValue(fileResponse);

				return { sourceFile, targetFile, userId, params, fileResponse };
			};

			it('should return one file response', async () => {
				const { sourceFile, params, userId, fileResponse } = setup();

				const result = await service.copy(userId, [sourceFile, sourceFile], params);

				expect(result).toEqual([fileResponse]);
			});
		});
	});
});
