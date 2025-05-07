import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { CopyFiles, S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordParamsTestFactory, fileRecordTestFactory } from '../../testing';
import { ScanStatus } from '../file-record.do';
import { FileRecordFactory } from '../file-record.factory';
import { CopyFileResult, FILE_RECORD_REPO, FileRecordRepo } from '../interface';
import { FilesStorageService } from './files-storage.service';

describe('FilesStorageService copy methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageService,
				{
					provide: FILES_STORAGE_S3_CONNECTION,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FILE_RECORD_REPO,
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
		fileRecordRepo = module.get(FILE_RECORD_REPO);
		antivirusService = module.get(AntivirusService);
	});

	beforeEach(() => {
		jest.restoreAllMocks();
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
				const {
					fileRecords: sourceFileRecords,
					parentInfo: sourceParentInfo,
					parentId: userId,
				} = FileRecordParamsTestFactory.build();
				const { fileRecords: targetFileRecords, parentInfo: targetParentInfo } = FileRecordParamsTestFactory.build();

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([
					sourceFileRecords,
					sourceFileRecords.length,
				]);
				spy = jest.spyOn(service, 'copy');
				spy.mockResolvedValueOnce(targetFileRecords);

				return {
					sourceParentInfo,
					targetParentInfo,
					sourceFileRecords,
					targetFileRecords,
					userId,
				};
			};

			it('should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { userId, sourceParentInfo, targetParentInfo } = setup();

				await service.copyFilesOfParent(userId, sourceParentInfo, targetParentInfo);

				expect(fileRecordRepo.findByStorageLocationIdAndParentId).toHaveBeenNthCalledWith(
					1,
					sourceParentInfo.storageLocation,
					sourceParentInfo.storageLocationId,
					sourceParentInfo.parentId
				);
			});

			it('should call copy with correct params', async () => {
				const { userId, sourceParentInfo, targetParentInfo, sourceFileRecords } = setup();

				await service.copyFilesOfParent(userId, sourceParentInfo, targetParentInfo);

				expect(service.copy).toHaveBeenCalledWith(userId, sourceFileRecords, targetParentInfo);
			});

			it('should return file records and count', async () => {
				const { userId, sourceParentInfo, targetParentInfo, targetFileRecords } = setup();

				const responseData = await service.copyFilesOfParent(userId, sourceParentInfo, targetParentInfo);

				expect(responseData[0]).toEqual(targetFileRecords);
				expect(responseData[1]).toEqual(targetFileRecords.length);
			});
		});

		describe('WHEN no file is found', () => {
			const setup = () => {
				const { fileRecords, parentInfo: sourceParentInfo, parentId: userId } = FileRecordParamsTestFactory.build();
				const { parentInfo: targetParentInfo } = FileRecordParamsTestFactory.build();

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([[], 0]);

				return { sourceParentInfo, targetParentInfo, fileRecords, userId };
			};

			it('should return empty response if entities not found', async () => {
				const { userId, sourceParentInfo, targetParentInfo } = setup();

				const result = await service.copyFilesOfParent(userId, sourceParentInfo, targetParentInfo);

				expect(result).toEqual([[], 0]);
			});
		});

		describe('WHEN copy throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const {
					fileRecords: sourceFileRecords,
					parentInfo: sourceParentInfo,
					parentId: userId,
				} = FileRecordParamsTestFactory.build();
				const { parentInfo: targetParentInfo } = FileRecordParamsTestFactory.build();
				const error = new Error('test');

				fileRecordRepo.findByStorageLocationIdAndParentId.mockResolvedValueOnce([
					sourceFileRecords,
					sourceFileRecords.length,
				]);
				spy = jest.spyOn(service, 'copy');
				spy.mockRejectedValueOnce(error);

				return { sourceParentInfo, targetParentInfo, userId, error };
			};

			it('should pass error', async () => {
				const { userId, sourceParentInfo, targetParentInfo, error } = setup();

				await expect(service.copyFilesOfParent(userId, sourceParentInfo, targetParentInfo)).rejects.toThrow(error);
			});
		});
	});

	describe('copy is called', () => {
		describe('WHEN files copied successfully and security status is VERIFIED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo: sourceParentInfo } = FileRecordParamsTestFactory.build();
				const sourceFile = fileRecords[0];
				sourceFile.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'verified');
				const targetFile = FileRecordFactory.copy(sourceFile, userId, sourceParentInfo);

				const fileResult: CopyFileResult = { id: targetFile.id, sourceId: sourceFile.id, name: targetFile.getName() };

				jest.spyOn(FileRecordFactory, 'copy').mockImplementationOnce(() => targetFile);

				return { sourceFile, targetFile, userId, sourceParentInfo, fileResponse: fileResult };
			};

			it('should call save with file record', async () => {
				const { sourceFile, targetFile, sourceParentInfo, userId } = setup();

				await service.copy(userId, [sourceFile], sourceParentInfo);

				expect(fileRecordRepo.save).toBeCalledWith(targetFile);
			});

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile, sourceParentInfo, userId } = setup();

				await service.copy(userId, [sourceFile], sourceParentInfo);

				const expectedParams: CopyFiles = {
					sourcePath: sourceFile.createPath(),
					targetPath: targetFile.createPath(),
				};

				expect(storageClient.copy).toBeCalledWith([expectedParams]);
			});

			it('should return file response array', async () => {
				const { sourceFile, sourceParentInfo, userId, fileResponse } = setup();

				const result = await service.copy(userId, [sourceFile], sourceParentInfo);

				expect(result).toEqual([fileResponse]);
			});

			it('should not send request token of copied file to antivirus service', async () => {
				const { sourceFile, sourceParentInfo, userId } = setup();

				await service.copy(userId, [sourceFile], sourceParentInfo);

				expect(antivirusService.send).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN source files scan status is PENDING', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo: sourceParentInfo } = FileRecordParamsTestFactory.build();
				const sourceFile = fileRecords[0];
				sourceFile.updateSecurityCheckStatus(ScanStatus.PENDING, 'not yet scanned');
				const targetFile = FileRecordFactory.copy(sourceFile, userId, sourceParentInfo);

				jest.spyOn(FileRecordFactory, 'copy').mockImplementationOnce(() => targetFile);

				return { sourceFile, userId, sourceParentInfo };
			};

			it('should send request token of copied file to antivirus service', async () => {
				const { sourceFile, sourceParentInfo, userId } = setup();

				await service.copy(userId, [sourceFile], sourceParentInfo);

				expect(antivirusService.send).toBeCalledTimes(1);
			});
		});

		describe('WHEN source files scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo: sourceParentInfo } = FileRecordParamsTestFactory.build();
				const fileRecord = fileRecords[0];
				fileRecord.updateSecurityCheckStatus(ScanStatus.BLOCKED, 'blocked');

				return { fileRecord, userId, sourceParentInfo };
			};

			it('should return failed file record (=without new id)', async () => {
				const { fileRecord, sourceParentInfo, userId } = setup();

				const result = await service.copy(userId, [fileRecord], sourceParentInfo);
				const expected = { sourceId: fileRecord.id, name: fileRecord.getName() };

				expect(result[0]).toEqual(expected);
			});
		});

		describe('WHEN source file is marked for delete', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const storageLocationId = new ObjectId().toHexString();

				const fileRecord = fileRecordTestFactory().withDeletedSince().build({ parentId: userId, storageLocationId });

				const parentInfo = FileRecordParamsTestFactory.buildFromInput({
					storageLocationId,
					parentId: userId,
				});

				return { fileRecord, userId, parentInfo };
			};

			it('should return failed file record (=without new id)', async () => {
				const { fileRecord, parentInfo, userId } = setup();

				const results = await service.copy(userId, [fileRecord], parentInfo);
				const result = results[0];

				expect(result.id).toBeDefined();

				const expected: CopyFileResult = { id: result.id, sourceId: fileRecord.id, name: fileRecord.getName() };

				expect(result.id).not.toEqual(fileRecord.id);
				expect(result).toEqual(expected);
			});
		});

		describe('WHEN copying two files and one file record save throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo } = FileRecordParamsTestFactory.build();
				const sourceFile1 = fileRecords[0];
				const sourceFile2 = fileRecords[2];
				const error = new Error('test');

				fileRecordRepo.save.mockResolvedValueOnce().mockRejectedValueOnce(error);

				const fileResponse2: CopyFileResult = { id: undefined, sourceId: sourceFile2.id, name: sourceFile2.getName() };

				return { sourceFile1, sourceFile2, userId, parentInfo, fileResponse2 };
			};

			it('should return one file response and one failed file response', async () => {
				const { sourceFile1, sourceFile2, parentInfo, userId, fileResponse2 } = setup();

				const [result1, result2] = await service.copy(userId, [sourceFile1, sourceFile2], parentInfo);

				expect(result1.id).toBeDefined();

				const fileResponse1: CopyFileResult = {
					id: result1.id,
					sourceId: sourceFile1.id,
					name: sourceFile1.getName(),
				};

				expect(result1.id).not.toEqual(sourceFile1.id);
				expect(result1).toEqual(fileResponse1);
				expect(result2).toEqual(fileResponse2);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo } = FileRecordParamsTestFactory.build();
				const sourceFile = fileRecords[0];
				sourceFile.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'verified');
				const targetFile = FileRecordFactory.copy(sourceFile, userId, parentInfo);

				jest.spyOn(FileRecordFactory, 'copy').mockImplementationOnce(() => targetFile);

				const expectedResponse = [{ sourceId: sourceFile.id, name: sourceFile.getName() }];
				const error = new Error('test');

				storageClient.copy.mockRejectedValueOnce(error);

				return { sourceFile, targetFile, userId, parentInfo, error, expectedResponse };
			};

			it('should delete target file record', async () => {
				const { sourceFile, targetFile, parentInfo, userId, expectedResponse } = setup();

				const result = await service.copy(userId, [sourceFile], parentInfo);

				expect(result).toEqual(expectedResponse);
				expect(fileRecordRepo.delete).toBeCalledWith([targetFile]);
			});
		});

		describe('WHEN anti virus service throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, parentInfo } = FileRecordParamsTestFactory.build();
				const sourceFile = fileRecords[0];
				sourceFile.updateSecurityCheckStatus(ScanStatus.PENDING, 'not yet scanned');
				const targetFile = FileRecordFactory.copy(sourceFile, userId, parentInfo);

				jest.spyOn(FileRecordFactory, 'copy').mockImplementationOnce(() => targetFile);

				const expectedResponse = [{ sourceId: sourceFile.id, name: sourceFile.getName() }];
				const error = new Error('test');

				antivirusService.send.mockRejectedValueOnce(error);

				return { sourceFile, targetFile, userId, parentInfo, error, expectedResponse };
			};

			it('should delete file record', async () => {
				const { sourceFile, targetFile, parentInfo, userId, expectedResponse } = setup();

				const result = await service.copy(userId, [sourceFile], parentInfo);

				expect(result).toEqual(expectedResponse);
				expect(fileRecordRepo.delete).toHaveBeenCalledWith([targetFile]);
			});
		});
	});
});
