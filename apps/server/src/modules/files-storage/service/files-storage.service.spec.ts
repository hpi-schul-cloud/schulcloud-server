import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecord, FileRecordParentType, ScanStatus } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { FileRecordRepo } from '@shared/repo';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import _ from 'lodash';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import {
	CopyFileResponse,
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto';
import { ErrorType } from '../error';
import {
	createICopyFiles,
	createPath,
	createFileRecord,
	getPaths,
	resolveFileNameDuplicates,
	unmarkForDelete,
} from '../helper';
import { IFile, IGetFileResponse } from '../interface';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from './files-storage.service';

const getFileRecordsWithParams = () => {
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

const getFileRecordWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' });
	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord };
};

describe('FilesStorageService', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
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

	afterAll(async () => {
		await orm.close();
	});

	afterEach(async () => {
		await module.close();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getFileRecord is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { params, fileRecord } = getFileRecordWithParams();
				fileRecordRepo.findOneById.mockResolvedValueOnce(fileRecord);

				return { params, fileRecord };
			};

			it('should call findOneById', async () => {
				const { params, fileRecord } = setup();

				await service.getFileRecord(params);

				expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(fileRecord.id);
			});

			it('should return the matched fileRecord', async () => {
				const { params, fileRecord } = setup();

				const result = await service.getFileRecord(params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { params } = getFileRecordWithParams();

				fileRecordRepo.findOneById.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFileRecord(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('getFileRecordBySecurityCheckRequestToken is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { fileRecord } = getFileRecordWithParams();
				const token = 'token';
				fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);

				return { fileRecord, token };
			};

			it('should call findOneById', async () => {
				const { token } = setup();

				await service.getFileRecordBySecurityCheckRequestToken(token);

				expect(fileRecordRepo.findBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});

			it('should return the matched fileRecord', async () => {
				const { fileRecord, token } = setup();

				const result = await service.getFileRecordBySecurityCheckRequestToken(token);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const error = new Error('test');
				const token = 'token';

				fileRecordRepo.findBySecurityCheckRequestToken.mockRejectedValueOnce(error);

				return { error, token };
			};

			it('should pass the error', async () => {
				const { error, token } = setup();

				await expect(service.getFileRecordBySecurityCheckRequestToken(token)).rejects.toThrow(error);
			});
		});
	});

	describe('getFileRecordMarkedForDelete is called', () => {
		describe('WHEN marked file exists', () => {
			const setup = () => {
				const { params, fileRecord } = getFileRecordWithParams();
				fileRecordRepo.findOneByIdMarkedForDelete.mockResolvedValueOnce(fileRecord);

				return { params, fileRecord };
			};

			it('should call findOneByIdMarkedForDelete', async () => {
				const { params, fileRecord } = setup();

				await service.getFileRecordMarkedForDelete(params);

				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledWith(fileRecord.id);
			});

			it('should return the matched fileRecord', async () => {
				const { params, fileRecord } = setup();

				const result = await service.getFileRecordMarkedForDelete(params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { params } = getFileRecordWithParams();

				fileRecordRepo.findOneByIdMarkedForDelete.mockRejectedValueOnce(new Error('test'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFileRecordMarkedForDelete(params)).rejects.toThrow(new Error('test'));
			});
		});
	});

	describe('getFileRecordsOfParent is called', () => {
		describe('WHEN valid files exist', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('should call findBySchoolIdAndParentId with right parameters', async () => {
				const { params } = setup();

				await service.getFileRecordsOfParent(params);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(1, params.schoolId, params.parentId);
			});

			it('should return the matched fileRecord', async () => {
				const { params, fileRecords } = setup();

				const result = await service.getFileRecordsOfParent(params);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { params } = getFileRecordsWithParams();

				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFileRecordsOfParent(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('createFileInStorageAndRollbackOnError is called', () => {
		describe('storage client creates file successfully', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<IFile>();

				return { params, fileRecord, fileDescription };
			};

			it('should call client storage create with correct params', async () => {
				const { params, fileRecord, fileDescription } = setup();

				await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				const filePath = createPath(params.schoolId, fileRecord.id);

				expect(storageClient.create).toHaveBeenCalledWith(filePath, fileDescription);
			});

			it('should return file record', async () => {
				const { params, fileRecord, fileDescription } = setup();

				const result = await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('storage client throws error', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<IFile>();
				const error = new Error('test');

				storageClient.create.mockRejectedValueOnce(error);

				return { params, fileRecord, fileDescription, error };
			};

			it('should not call antivirus service', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(antivirusService.send).toHaveBeenCalledTimes(0);
			});

			it('should call file record repo delete', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('file record is send to antivirus successfully', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<IFile>();

				return { params, fileRecord, fileDescription };
			};

			it('should call anitvirus send with correct params', async () => {
				const { params, fileRecord, fileDescription } = setup();

				await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				expect(antivirusService.send).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('antivirus throws error', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<IFile>();
				const error = new Error('test');

				antivirusService.send.mockImplementation(() => {
					throw error;
				});

				return { params, fileRecord, fileDescription, error };
			};

			it('should call file record repo delete', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toHaveBeenCalledWith(fileRecord);
			});
		});
	});

	describe('uploadFile is called', () => {
		let getSpy: jest.SpyInstance;
		let trySpy: jest.SpyInstance;

		afterEach(() => {
			getSpy.mockRestore();
			trySpy.mockRestore();
		});

		const getUploadFileParams = () => {
			const { params, fileRecords, parentId: userId } = getFileRecordsWithParams();

			const fileDescription = createMock<IFile>();
			fileDescription.name = fileRecords[0].name;
			fileDescription.size = 122;
			fileDescription.mimeType = 'mimeType';

			const fileRecord = createFileRecord(
				fileDescription.name,
				fileDescription.size,
				fileDescription.mimeType,
				params,
				userId
			);

			const { securityCheck, ...expectedFileRecord } = fileRecord;
			expectedFileRecord.name = resolveFileNameDuplicates(fileRecord.name, fileRecords);

			return { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords };
		};

		describe('WHEN storage client creates file successfully', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords } = getUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord };
			};

			it('should call getFileRecordsOfParent with correct params', async () => {
				const { params, fileDescription, userId } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(service.getFileRecordsOfParent).toHaveBeenCalledWith(params);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord } = getUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call save and createFileInStorageAndRollbackOnError', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file record repo saves successfully', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords } = getUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord };
			};

			it('should call fileRecordRepo save with correct params', async () => {
				const { params, fileDescription, userId, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						createdAt: expect.any(Date) as Date,
						updatedAt: expect.any(Date) as Date,
					})
				);
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords } = getUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				fileRecordRepo.save.mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call createFileInStorageAndRollbackOnError', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file is successfully created in storage', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords } = getUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord };
			};

			it('should call createFileInStorageAndRollbackOnError with correct params', async () => {
				const { params, fileDescription, userId, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						createdAt: expect.any(Date) as Date,
						updatedAt: expect.any(Date) as Date,
					}),
					params,
					fileDescription
				);
			});
		});

		describe('WHEN tryToCreateFileInStorage throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, expectedFileRecord, fileRecords } = getUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockRejectedValueOnce(error);

				return { params, fileDescription, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);
			});
		});
	});

	describe('patchFilename is called', () => {
		describe('WHEN file(s) exists and valid params are passed', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, params } = getFileRecordsWithParams();
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

				expect(spy).toHaveBeenCalledWith(fileRecordParams);
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
				const { fileRecord, params } = getFileRecordWithParams();
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
	});

	describe('updateSecurityStatus is called', () => {
		describe('WHEN file exists and no virus is found', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecord } = getFileRecordWithParams();
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

				expect(spy).toHaveBeenCalledWith(ScanStatus.VERIFIED, undefined);
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
				const { fileRecord } = getFileRecordWithParams();
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

				expect(spy).toHaveBeenCalledWith(ScanStatus.BLOCKED, 'Win.Test.EICAR_HDB-1');
			});

			it('should call repo method save() to persist the result', async () => {
				const { scanResult, token, fileRecord } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('WHEN no matching file is found', () => {
			const setup = () => {
				const { fileRecord } = getFileRecordWithParams();
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
				const { fileRecord } = getFileRecordWithParams();
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

	describe('download is called', () => {
		let spy: jest.SpyInstance;

		afterEach(() => {
			spy.mockRestore();
		});

		describe('WHEN param file name is not matching found file name', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const paramsFileName = 'paramsFileName';
				const params = {
					fileRecordId: fileRecord.id,
					fileName: paramsFileName,
				};

				spy = jest.spyOn(service, 'downloadFile');

				return { fileRecord, params };
			};

			it('throws error', async () => {
				const { fileRecord, params } = setup();

				const error = new NotFoundException(ErrorType.FILE_NOT_FOUND);

				await expect(service.download(fileRecord, params)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN file records scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.securityCheck.status = ScanStatus.BLOCKED;
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};

				jest.spyOn(service, 'downloadFile');

				return { fileRecord, params };
			};

			it('throws error', async () => {
				const { fileRecord, params } = setup();

				const error = new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);

				await expect(service.download(fileRecord, params)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};

				const expectedResponse = createMock<IGetFileResponse>();

				spy = jest.spyOn(service, 'downloadFile').mockResolvedValueOnce(expectedResponse);

				return { fileRecord, params, expectedResponse };
			};

			it('calls downloadFile with correct params', async () => {
				const { fileRecord, params } = setup();

				await service.download(fileRecord, params);

				expect(service.downloadFile).toHaveBeenCalledWith(fileRecord.schoolId, fileRecord.id);
			});

			it('returns correct response', async () => {
				const { fileRecord, params, expectedResponse } = setup();

				const response = await service.download(fileRecord, params);

				expect(response).toEqual(expectedResponse);
			});
		});

		describe('WHEN download throws error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};
				const error = new Error('test');

				spy = jest.spyOn(service, 'downloadFile').mockRejectedValueOnce(error);

				return { fileRecord, params, error };
			};
			it('passes error', async () => {
				const { fileRecord, params, error } = setup();

				await expect(service.download(fileRecord, params)).rejects.toThrowError(error);
			});
		});
	});

	describe('downloadFile is called', () => {
		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];

				const expectedResponse = createMock<IGetFileResponse>();

				storageClient.get.mockResolvedValueOnce(expectedResponse);

				return { fileRecord, expectedResponse };
			};

			it('calls get with correct params', async () => {
				const { fileRecord } = setup();

				const path = createPath(fileRecord.schoolId, fileRecord.id);

				await service.downloadFile(fileRecord.schoolId, fileRecord.id);

				expect(storageClient.get).toHaveBeenCalledWith(path);
			});

			it('returns correct response', async () => {
				const { fileRecord, expectedResponse } = setup();

				const response = await service.downloadFile(fileRecord.schoolId, fileRecord.id);

				expect(response).toEqual(expectedResponse);
			});
		});

		describe('WHEN get throws error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const error = new Error('test');

				storageClient.get.mockRejectedValueOnce(error);

				return { fileRecord, error };
			};

			it('passes error', async () => {
				const { fileRecord, error } = setup();

				await expect(service.downloadFile(fileRecord.schoolId, fileRecord.id)).rejects.toThrowError(error);
			});
		});
	});

	describe('delete is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.save.mockResolvedValueOnce();

				return { fileRecords };
			};

			it('should call repo save with right parameters', async () => {
				const { fileRecords } = setup();

				await service.delete(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) as Date }),
						expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) as Date }),
						expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) as Date }),
					])
				);
			});

			it('should call storageClient.delete', async () => {
				const { fileRecords } = setup();
				const paths = getPaths(fileRecords);

				await service.delete(fileRecords);

				expect(storageClient.delete).toHaveBeenCalledWith(paths);
			});
		});

		describe('WHEN repository throw an error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.save.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords };
			};

			it('should pass the error', async () => {
				const { fileRecords } = setup();

				await expect(service.delete(fileRecords)).rejects.toThrow(new Error('bla'));
			});
		});

		describe('WHEN filestorage client throw an error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				storageClient.delete.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords };
			};

			it('should throw error if entity not found', async () => {
				const { fileRecords } = setup();

				await expect(service.delete(fileRecords)).rejects.toThrow(new InternalServerErrorException('bla'));
				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(2, fileRecords);
			});
		});
	});

	describe('deleteFilesOfParent is called', () => {
		describe('WHEN valid files exists', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, params } = getFileRecordsWithParams();

				spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { params } = setup();

				await service.deleteFilesOfParent(params);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(1, params.schoolId, params.parentId);
			});

			it('should call delete with correct params', async () => {
				const { params, fileRecords } = setup();

				await service.deleteFilesOfParent(params);

				expect(service.delete).toHaveBeenCalledWith(fileRecords);
			});

			it('should return file records and count', async () => {
				const { params, fileRecords } = setup();

				const responseData = await service.deleteFilesOfParent(params);
				expect(responseData[0]).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecords[0] }),
						expect.objectContaining({ ...fileRecords[1] }),
						expect.objectContaining({ ...fileRecords[2] }),
					])
				);
				expect(responseData[1]).toEqual(fileRecords.length);
			});
		});

		describe('WHEN no files exists', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const fileRecords = [];
				const { params } = getFileRecordsWithParams();

				spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params };
			};

			it('should not call delete', async () => {
				const { params } = setup();

				await service.deleteFilesOfParent(params);

				expect(service.delete).toHaveBeenCalledTimes(0);
			});

			it('should return empty counted type', async () => {
				const { params } = setup();

				const result = await service.deleteFilesOfParent(params);

				expect(result).toEqual([[], 0]);
			});
		});

		describe('WHEN repository throw an error', () => {
			const setup = () => {
				const { params } = getFileRecordsWithParams();

				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.deleteFilesOfParent(params)).rejects.toThrow(new Error('bla'));
			});
		});

		describe('WHEN service.delete throw an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();

				spy = jest.spyOn(service, 'delete').mockRejectedValue(new Error('bla'));
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.deleteFilesOfParent(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN valid files exist', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([
					fileRecords,
					fileRecords.length,
				]);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { params, fileRecords };
			};

			it('should call repo method findBySchoolIdAndParentIdAndMarkedForDelete with correct params', async () => {
				const { params } = setup();

				await service.restoreFilesOfParent(params);

				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledWith(
					params.schoolId,
					params.parentId
				);
			});

			it('should call service restore with correct params', async () => {
				const { params, fileRecords } = setup();

				await service.restoreFilesOfParent(params);

				expect(spy).toHaveBeenCalledWith(fileRecords);
			});

			it('should return counted fileRecords', async () => {
				const { params, fileRecords } = setup();

				const result = await service.restoreFilesOfParent(params);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN no files exist', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params } = getFileRecordsWithParams();

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([[], 0]);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { params };
			};

			it('should skip service restore call', async () => {
				const { params } = setup();

				await service.restoreFilesOfParent(params);

				expect(spy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN repository throws an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params } = getFileRecordsWithParams();
				const error = new Error('bla');

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockRejectedValueOnce(error);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { params, error };
			};

			it('should pass the error', async () => {
				const { params, error } = setup();

				await expect(service.restoreFilesOfParent(params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN service throws an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				const error = new Error('bla');

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([fileRecords, 3]);
				spy = jest.spyOn(service, 'restore').mockRejectedValueOnce(error);

				return { params, error };
			};

			it('should pass the error', async () => {
				const { params, error } = setup();

				await expect(service.restoreFilesOfParent(params)).rejects.toThrowError(error);
			});
		});
	});

	describe('restore is called', () => {
		describe('WHEN valid files exist', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.save.mockResolvedValueOnce();

				return { fileRecords };
			};

			it('should call repo save with right parameters', async () => {
				const { fileRecords } = setup();

				const unmarkedFileRecords = unmarkForDelete(fileRecords);

				await service.restore(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(1, unmarkedFileRecords);
			});

			it('should call storageClient.restore', async () => {
				const { fileRecords } = setup();
				const paths = getPaths(fileRecords);

				await service.restore(fileRecords);

				expect(storageClient.restore).toHaveBeenCalledWith(paths);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.save.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords };
			};

			it('should pass the error', async () => {
				const { fileRecords } = setup();

				await expect(service.restore(fileRecords)).rejects.toThrow(new Error('bla'));
			});
		});

		describe('WHEN filestorage client throw an error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				storageClient.restore.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords };
			};

			it('should pass the error', async () => {
				const { fileRecords } = setup();

				await expect(service.restore(fileRecords)).rejects.toThrow(new Error('bla'));
			});

			it('should save the rollback', async () => {
				const { fileRecords } = setup();

				await expect(service.restore(fileRecords)).rejects.toThrow(new Error('bla'));
				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(
					2,
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) as Date }),
						expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) as Date }),
						expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) as Date }),
					])
				);
			});
		});
	});

	describe('copyFilesOfParent is called', () => {
		describe('WHEN no file is found', () => {
			const setup = () => {
				const { fileRecords, params: sourceParams, parentId: userId } = getFileRecordsWithParams();
				const { params } = getFileRecordsWithParams();
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

		describe('WHEN files exist and copyFiles copied files successfully', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords: sourceFileRecords, params: sourceParams, parentId: userId } = getFileRecordsWithParams();
				const { fileRecords: targetFileRecords, params } = getFileRecordsWithParams();
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

		describe('WHEN copy throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords: sourceFileRecords, params: sourceParams, parentId: userId } = getFileRecordsWithParams();
				const { params } = getFileRecordsWithParams();
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
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];

				return { sourceFile, userId, params };
			};

			it('should call save with file record', async () => {
				const { userId, sourceFile, params } = setup();

				await service.copyFileRecord(sourceFile, params, userId);

				expect(fileRecordRepo.save).toBeCalledWith(expect.any(FileRecord) as FileRecord);
			});
		});

		describe('WHEN save throws error', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
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
				const { fileRecords } = getFileRecordsWithParams();
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

				const expectedFileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});

				expect(result).toEqual(expectedFileResponse);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
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

		describe('WHEN anti virus service resolves', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				spy = jest.spyOn(service, 'sendToAntiVirusService');

				return { sourceFile, targetFile };
			};

			it('should call copy with correct params', async () => {
				const { sourceFile, targetFile } = setup();

				await service.copyFilesWithRollbackOnError(sourceFile, targetFile);

				expect(service.sendToAntiVirusService).toBeCalledWith(sourceFile);
			});
		});

		describe('WHEN anti virus service throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				spy = jest.spyOn(service, 'sendToAntiVirusService').mockImplementation(() => {
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

	describe('sendToAntiVirusService is called', () => {
		describe('WHEN security status is pending', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.PENDING;

				return { sourceFile };
			};

			it('should call send with correct params', () => {
				const { sourceFile } = setup();

				service.sendToAntiVirusService(sourceFile);

				expect(antivirusService.send).toBeCalledWith(sourceFile);
			});
		});

		describe('WHEN security status is verfied', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.VERIFIED;

				return { sourceFile };
			};

			it('should call send with correct params', () => {
				const { sourceFile } = setup();

				service.sendToAntiVirusService(sourceFile);

				expect(antivirusService.send).toBeCalledTimes(0);
			});
		});

		describe('WHEN security status is blocked', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.BLOCKED;

				return { sourceFile };
			};

			it('should call send with correct params', () => {
				const { sourceFile } = setup();

				service.sendToAntiVirusService(sourceFile);

				expect(antivirusService.send).toBeCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				sourceFile.securityCheck.status = ScanStatus.PENDING;
				const error = new Error('test');

				antivirusService.send.mockImplementation(() => {
					throw error;
				});

				return { sourceFile, error };
			};

			it('should pass error', () => {
				const { sourceFile, error } = setup();

				expect(() => service.sendToAntiVirusService(sourceFile)).toThrow(error);
			});
		});
	});

	describe('copy is called', () => {
		describe('WHEN source files scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
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
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
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

		describe('WHEN file records and files copied successfully', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				spy = jest.spyOn(service, 'copyFileRecord').mockResolvedValueOnce(targetFile);

				const fileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});
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

		describe('WHEN one copy file record throws error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				spy = jest.spyOn(service, 'copyFileRecord');
				spy.mockRejectedValueOnce(error).mockResolvedValueOnce(targetFile);

				const fileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});
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
				const { fileRecords, parentId: userId, params } = getFileRecordsWithParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];
				const error = new Error('test');

				spy = jest.spyOn(service, 'copyFileRecord');
				spy.mockResolvedValue(targetFile);

				const fileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});
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
