import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, ScanStatus } from '../entity';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createCopyFiles } from '../helper';
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

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageService,
				{
					provide: FILES_STORAGE_S3_CONNECTION,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AntivirusService,
					useValue: createMock<AntivirusService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(FILES_STORAGE_S3_CONNECTION);
		fileRecordRepo = module.get(FileRecordRepo);
		antivirusService = module.get(AntivirusService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
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

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([
					sourceFileRecords,
					sourceFileRecords.length,
				]);
				spy = jest.spyOn(service, 'copy');
				spy.mockResolvedValueOnce(targetFileRecords);

				return { sourceParams, copyFilesOfParentParams, sourceFileRecords, targetFileRecords, userId };
			};

			it('should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { userId, sourceParams, copyFilesOfParentParams } = setup();

				await service.copyFilesOfParent(userId, sourceParams, copyFilesOfParentParams);

				expect(fileRecordRepo.findByStorageLocationIdAndParentId).toHaveBeenNthCalledWith(
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

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([[], 0]);

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

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([
					sourceFileRecords,
					sourceFileRecords.length,
				]);
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

	describe('copy is called', () => {
		describe('WHEN files copied successfully and security status is VERIFIED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.VERIFIED;
				const targetFile = sourceFile.copy(userId, params);
				targetFile._id = new ObjectId();

				const fileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);

				jest.spyOn(sourceFile, 'copy').mockImplementationOnce(() => targetFile);

				return { sourceFile, targetFile, userId, params, fileResponse };
			};

			it('should call save with file record', async () => {
				const { sourceFile, targetFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				expect(fileRecordRepo.save).toBeCalledWith(targetFile);
			});

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				const expectedParams = createCopyFiles(sourceFile, targetFile);

				expect(storageClient.copy).toBeCalledWith([expectedParams]);
			});

			it('should return file response array', async () => {
				const { sourceFile, params, userId, fileResponse } = setup();

				const result = await service.copy(userId, [sourceFile], params);

				expect(result).toEqual([fileResponse]);
			});

			it('should not send request token of copied file to antivirus service', async () => {
				const { sourceFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				expect(antivirusService.send).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN source files scan status is PENDING', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.PENDING;
				const targetFile = sourceFile.copy(userId, params);
				targetFile._id = new ObjectId();

				jest.spyOn(sourceFile, 'copy').mockImplementationOnce(() => targetFile);

				return { sourceFile, userId, params };
			};

			it('should send request token of copied file to antivirus service', async () => {
				const { sourceFile, params, userId } = setup();

				await service.copy(userId, [sourceFile], params);

				expect(antivirusService.send).toBeCalledTimes(1);
			});
		});

		describe('WHEN source files scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord, userId, params };
			};

			it('should return failed file record (=without new id)', async () => {
				const { fileRecord, params, userId } = setup();

				const result = await service.copy(userId, [fileRecord], params);
				const expected = { sourceId: fileRecord.id, name: fileRecord.name };

				expect(result[0]).toEqual(expected);
			});
		});

		describe('WHEN source file is marked for delete', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.deletedSince = new Date();

				return { fileRecord, userId, params };
			};

			it('should return failed file record (=without new id)', async () => {
				const { fileRecord, params, userId } = setup();

				const result = await service.copy(userId, [fileRecord], params);
				const expected = { sourceId: fileRecord.id, name: fileRecord.name };

				expect(result[0]).toEqual(expected);
			});
		});

		describe('WHEN copying two files and one file record save throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile1 = fileRecords[0];
				const targetFile1 = sourceFile1.copy(userId, params);
				targetFile1._id = new ObjectId();
				const sourceFile2 = fileRecords[2];
				const error = new Error('test');

				fileRecordRepo.save.mockResolvedValueOnce();
				jest.spyOn(sourceFile1, 'copy').mockImplementationOnce(() => targetFile1);
				fileRecordRepo.save.mockRejectedValueOnce(error);

				const fileResponse1 = CopyFileResponseBuilder.build(targetFile1.id, sourceFile1.id, sourceFile1.name);
				const fileResponse2 = { sourceId: sourceFile2.id, name: sourceFile2.name };

				return { sourceFile1, targetFile1, sourceFile2, userId, params, fileResponse1, fileResponse2 };
			};

			it('should return one file response and one failed file response', async () => {
				const { sourceFile1, sourceFile2, params, userId, fileResponse1, fileResponse2 } = setup();

				const [result1, result2] = await service.copy(userId, [sourceFile1, sourceFile2], params);

				expect(result1).toEqual(fileResponse1);
				expect(result2).toEqual(fileResponse2);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.VERIFIED;
				const targetFile = sourceFile.copy(userId, params);
				targetFile._id = new ObjectId();

				jest.spyOn(sourceFile, 'copy').mockImplementationOnce(() => targetFile);

				const expectedResponse = [{ sourceId: sourceFile.id, name: sourceFile.name }];
				const error = new Error('test');

				storageClient.copy.mockRejectedValueOnce(error);

				return { sourceFile, targetFile, userId, params, error, expectedResponse };
			};

			it('should delete target file record', async () => {
				const { sourceFile, targetFile, params, userId, expectedResponse } = setup();

				const result = await service.copy(userId, [sourceFile], params);

				expect(result).toEqual(expectedResponse);
				expect(fileRecordRepo.delete).toBeCalledWith([targetFile]);
			});
		});

		describe('WHEN anti virus service throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = buildFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.PENDING;
				const targetFile = sourceFile.copy(userId, params);
				targetFile._id = new ObjectId();

				jest.spyOn(sourceFile, 'copy').mockImplementationOnce(() => targetFile);

				const expectedResponse = [{ sourceId: sourceFile.id, name: sourceFile.name }];
				const error = new Error('test');

				antivirusService.send.mockRejectedValueOnce(error);

				return { sourceFile, targetFile, userId, params, error, expectedResponse };
			};

			it('should delete file record', async () => {
				const { sourceFile, targetFile, params, userId, expectedResponse } = setup();

				const result = await service.copy(userId, [sourceFile], params);

				expect(result).toEqual(expectedResponse);
				expect(fileRecordRepo.delete).toHaveBeenCalledWith([targetFile]);
			});
		});
	});
});
