import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import _ from 'lodash';
import { FileRecordParams, RenameFileParams, ScanResultParams, SingleFileParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, StorageLocation } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { FileRecordMapper, FilesStorageMapper } from '../mapper';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId, storageLocationId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId, storageLocationId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId, storageLocationId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, parentId };
};

const buildFileRecordWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId, storageLocationId, name: 'text.txt' });
	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord };
};

describe('FilesStorageService update methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;

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
		fileRecordRepo = module.get(FileRecordRepo);
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
				const { fileRecords, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const data: RenameFileParams = { fileName: 'renamed' };

				spy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					data,
					fileRecord,
					fileRecords,
					params,
				};
			};

			it('should call getFilesOfParent with right paramaters', async () => {
				const { fileRecord, data } = setup();
				const fileRecordParams = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);

				await service.patchFilename(fileRecord, data);

				expect(spy).toHaveBeenCalledWith(fileRecordParams.parentId);
			});

			it('should call fileRecordRepo.save with right paramaters', async () => {
				const { fileRecord, data } = setup();
				const expectedFileRecord = _.cloneDeep(fileRecord);
				expectedFileRecord.name = data.fileName;

				await service.patchFilename(fileRecord, data);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(expectedFileRecord);
			});

			it('should return modified fileRecord', async () => {
				const { fileRecord, data } = setup();

				const result = await service.patchFilename(fileRecord, data);

				expect(result.name).toEqual(data.fileName);
			});
		});

		describe('WHEN repository is throwing an error', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const data: RenameFileParams = { fileName: 'renamed' };

				const spyGetFilesOfParent = jest
					.spyOn(service, 'getFileRecordsOfParent')
					.mockResolvedValueOnce([[fileRecord], 1]);
				fileRecordRepo.save.mockRejectedValueOnce(new Error('bla'));

				return {
					data,
					fileRecord,
					params,
					spyGetFilesOfParent,
				};
			};

			it('should pass the error', async () => {
				const { fileRecord, data } = setup();

				await expect(service.patchFilename(fileRecord, data)).rejects.toThrowError(new Error('bla'));
			});
		});

		describe('WHEN file name already exists', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, params } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const data: RenameFileParams = { fileName: fileRecords[0].name };

				spy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					data,
					fileRecord,
					fileRecords,
					params,
				};
			};

			it('should pass the error', async () => {
				const { fileRecord, data } = setup();
				const expectedError = new ConflictException(ErrorType.FILE_NAME_EXISTS);

				await expect(service.patchFilename(fileRecord, data)).rejects.toThrowError(expectedError);
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
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';

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

				const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(scanResult);
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
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: true, virus_signature: 'Win.Test.EICAR_HDB-1' };
				const token = fileRecord.securityCheck.requestToken || '';

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockResolvedValue();
				spy = jest.spyOn(fileRecord, 'updateSecurityCheckStatus');

				return { scanResult, token, fileRecord };
			};

			it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(scanResult);
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
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false, error: 'file to large' };
				const token = fileRecord.securityCheck.requestToken || '';

				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				fileRecordRepo.save.mockResolvedValue();
				spy = jest.spyOn(fileRecord, 'updateSecurityCheckStatus');

				return { scanResult, token, fileRecord };
			};

			it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(scanResult);
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
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';
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
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';
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
