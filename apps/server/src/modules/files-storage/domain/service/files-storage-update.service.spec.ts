import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService, ScanResult } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordParamsTestFactory, fileRecordTestFactory } from '../../testing';
import { ErrorType } from '../error';
import { FILE_RECORD_REPO, FileRecordRepo } from '../interface';
import { ScanResultDtoMapper } from '../mapper';
import { FilesStorageService } from './files-storage.service';

const buildFileRecord = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordTestFactory().build({ parentId, storageLocationId, name: 'text.txt' });

	return { fileRecord };
};

describe('FilesStorageService update methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;

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
		fileRecordRepo = module.get(FILE_RECORD_REPO);
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

	describe('patchFilename is called', () => {
		describe('WHEN file(s) exists and valid params are passed', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentInfo } = FileRecordParamsTestFactory.build();
				const fileRecord = fileRecords[0];
				const fileName = 'renamed';

				spy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					fileName,
					fileRecord,
					fileRecords,
					params: parentInfo,
				};
			};

			it('should call getFilesOfParent with right paramaters', async () => {
				const { fileRecord, fileName } = setup();
				const parentInfo = fileRecord.getParentInfo();

				await service.patchFilename(fileRecord, fileName);

				expect(spy).toHaveBeenCalledWith(parentInfo.parentId);
			});

			it('should call fileRecordRepo.save with right paramaters', async () => {
				const { fileRecord, fileName } = setup();
				const expectedFileRecord = _.cloneDeep(fileRecord);
				expectedFileRecord.setName(fileName);

				await service.patchFilename(fileRecord, fileName);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(expectedFileRecord);
			});

			it('should return modified fileRecord', async () => {
				const { fileRecord, fileName } = setup();

				const result = await service.patchFilename(fileRecord, fileName);

				expect(result.getName()).toEqual(fileName);
			});
		});

		describe('WHEN repository is throwing an error', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const fileName = 'renamed';

				const spyGetFilesOfParent = jest
					.spyOn(service, 'getFileRecordsOfParent')
					.mockResolvedValueOnce([[fileRecord], 1]);
				fileRecordRepo.save.mockRejectedValueOnce(new Error('bla'));

				return {
					fileName,
					fileRecord,
					spyGetFilesOfParent,
				};
			};

			it('should pass the error', async () => {
				const { fileRecord, fileName } = setup();

				await expect(service.patchFilename(fileRecord, fileName)).rejects.toThrowError(new Error('bla'));
			});
		});

		describe('WHEN file name already exists', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentInfo } = FileRecordParamsTestFactory.build();
				const fileRecord = fileRecords[0];
				const fileName = fileRecords[0].getName();

				spy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					fileName,
					fileRecord,
					fileRecords,
					params: parentInfo,
				};
			};

			it('should pass the error', async () => {
				const { fileRecord, fileName } = setup();
				const expectedError = new ConflictException(ErrorType.FILE_NAME_EXISTS);

				await expect(service.patchFilename(fileRecord, fileName)).rejects.toThrowError(expectedError);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe('updateSecurityStatus is called', () => {
		describe('WHEN file exists and no virus is found', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const scanResult: ScanResult = { virus_detected: false };
				const token = fileRecord.getSecurityToken() || '';

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockResolvedValue();
				spy = jest.spyOn(fileRecord, 'updateSecurityCheckStatus');

				return { scanResult, token, fileRecord };
			};

			it('should call repo method findBySecurityCheckRequestToken with right parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(fileRecordRepo.findBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});

			it('should call repo method updateSecurityCheckStatus with right parameters', async () => {
				const { token, scanResult } = setup();

				await service.updateSecurityStatus(token, scanResult);

				const { status, reason } = ScanResultDtoMapper.fromScanResult(scanResult);
				expect(spy).toHaveBeenCalledWith(status, reason);
			});

			it('should call repo method save() to persist the result', async () => {
				const { scanResult, token, fileRecord } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('WHEN file exists and a virus is found', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const scanResult: ScanResult = { virus_detected: true, virus_signature: 'Win.Test.EICAR_HDB-1' };
				const token = fileRecord.getSecurityToken() || '';

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockResolvedValue();
				spy = jest.spyOn(fileRecord, 'updateSecurityCheckStatus');

				return { scanResult, token, fileRecord };
			};

			it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				const { status, reason } = ScanResultDtoMapper.fromScanResult(scanResult);
				expect(spy).toHaveBeenCalledWith(status, reason);
			});

			it('should call repo method save() to persist the result', async () => {
				const { scanResult, token, fileRecord } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('WHEN file exists and a error is found', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const scanResult: ScanResult = { virus_detected: false, error: 'file to large' };
				const token = fileRecord.getSecurityToken() || '';

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockResolvedValue();
				spy = jest.spyOn(fileRecord, 'updateSecurityCheckStatus');

				return { scanResult, token, fileRecord };
			};

			it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				const { status, reason } = ScanResultDtoMapper.fromScanResult(scanResult);
				expect(spy).toHaveBeenCalledWith(status, reason);
			});

			it('should call repo method save() to persist the result', async () => {
				const { scanResult, token, fileRecord } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('WHEN no matching file is found', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const scanResult: ScanResult = { virus_detected: false };
				const token = fileRecord.getSecurityToken() || '';
				const error = new NotFoundException();

				fileRecordRepo.findBySecurityCheckRequestToken.mockRejectedValueOnce(error);

				return { scanResult, token, error };
			};

			it('should pass the not found exception', async () => {
				const { scanResult, token, error } = setup();

				await expect(service.updateSecurityStatus(token, scanResult)).rejects.toThrowError(error);
			});
		});

		describe('WHEN repository by call save is throw an error', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecord();
				const scanResult: ScanResult = { virus_detected: false };
				const token = fileRecord.getSecurityToken() || '';
				const error = new Error('bla');

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockRejectedValueOnce(error);

				return { scanResult, token, error };
			};

			it('should pass the exception', async () => {
				const { scanResult, token, error } = setup();

				await expect(service.updateSecurityStatus(token, scanResult)).rejects.toThrowError(error);
			});
		});
	});
});
