import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecord, FileRecordParentType, ScanStatus } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import _ from 'lodash';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { RenameFileParams, ScanResultParams } from '../controller/dto';
import { FilesStorageHelper } from '../helper';
import { FilesStorageService } from './files-storage.service';

describe('FilesStorageService', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let filesStorageHelper: FilesStorageHelper;
	let orm: MikroORM;

	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();
	const getFileRecords = () => {
		const fileRecords = [
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
		];

		return fileRecords;
	};
	const getRequestParams = () => {
		const requestParams = {
			schoolId,
			parentId: userId,
			parentType: FileRecordParentType.User,
		};

		return requestParams;
	};

	const getFileRecordsWithParams = () => {
		const parentId = new ObjectId().toHexString();
		const parentSchoolId = new ObjectId().toHexString();

		const fileRecords = [
			fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' }),
			fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-two.txt' }),
			fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-tree.txt' }),
		];

		const params = {
			schoolId: parentSchoolId,
			parentId,
			parentType: FileRecordParentType.User,
		};

		return { params, fileRecords };
	};

	const getFileRecordWithParams = () => {
		const parentId = new ObjectId().toHexString();
		const parentSchoolId = new ObjectId().toHexString();

		const fileRecord = fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' });
		const params = {
			fileRecordId: fileRecord.id,
		};

		return { params, fileRecord };
	};

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageService,
				FilesStorageHelper,
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
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		filesStorageHelper = module.get(FilesStorageHelper);
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

	it('helper should be defined', () => {
		expect(filesStorageHelper).toBeDefined();
	});

	describe('getFileById is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { params, fileRecord } = getFileRecordWithParams();
				fileRecordRepo.findOneById.mockResolvedValueOnce(fileRecord);

				return { params, fileRecord };
			};

			it('should call findOneById', async () => {
				const { params } = setup();

				await service.getFile(params);

				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('should return the matched fileRecord', async () => {
				const { params, fileRecord } = setup();

				const result = await service.getFile(params);

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

				await expect(service.getFile(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('getFilesOfParent is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('should call findBySchoolIdAndParentId with right parameters', async () => {
				const { params } = setup();

				await service.getFilesOfParent(params);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(1, params.schoolId, params.parentId);
			});

			it('should return the matched fileRecord', async () => {
				const { params, fileRecords } = setup();

				const result = await service.getFilesOfParent(params);

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

				await expect(service.getFilesOfParent(params)).rejects.toThrow(new Error('bla'));
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

				spy = jest.spyOn(service, 'getFilesOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					data,
					fileRecord,
					fileRecords,
					params,
				};
			};

			it('should call getFilesOfParent with right paramaters', async () => {
				const { fileRecord, data } = setup();
				const fileRecordParams = filesStorageHelper.mapFileRecordToFileRecordParams(fileRecord);

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

				const spyGetFilesOfParent = jest.spyOn(service, 'getFilesOfParent').mockResolvedValueOnce([[fileRecord], 1]);
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

	describe('delete is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { fileRecords } = getFileRecordsWithParams();

				fileRecordRepo.save.mockResolvedValueOnce();

				return { fileRecords };
			};

			it('should call repo save with right parameters', async () => {
				const { fileRecords } = setup();
				const fileRecordsCopy = fileRecords.map((fileRecord): FileRecord => _.cloneDeep(fileRecord));

				const markedFileRecords = filesStorageHelper.markForDelete(fileRecordsCopy);

				await service.delete(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(markedFileRecords);
			});

			it('should call storageClient.delete', async () => {
				const { fileRecords } = setup();
				const paths = filesStorageHelper.getPaths(fileRecords);

				await service.delete(fileRecords);

				expect(storageClient.delete).toHaveBeenCalledWith(paths);
			});
		});

		describe('WHEN repository throw an error', () => {
			const setup = () => {
				const fileRecords = getFileRecords();

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
				storageClient.delete.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords: getFileRecords() };
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
				const fileRecords = getFileRecords();
				const requestParams = getRequestParams();

				spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { requestParams, fileRecords };
			};

			it('should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { requestParams } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(
					1,
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should call delete with correct params', async () => {
				const { requestParams, fileRecords } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledWith(fileRecords);
			});

			it('should return file records and count', async () => {
				const { requestParams, fileRecords } = setup();

				const responseData = await service.deleteFilesOfParent(requestParams);
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
				const requestParams = getRequestParams();

				spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { requestParams };
			};

			it('should not call delete', async () => {
				const { requestParams } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledTimes(0);
			});

			it('should return empty counted type', async () => {
				const { requestParams } = setup();

				const result = await service.deleteFilesOfParent(requestParams);

				expect(result).toEqual([[], 0]);
			});
		});

		describe('WHEN repository throw an error', () => {
			const setup = () => {
				const requestParams = getRequestParams();

				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValueOnce(new Error('bla'));

				return { requestParams };
			};

			it('should pass the error', async () => {
				const { requestParams } = setup();

				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow(new Error('bla'));
			});
		});

		describe('WHEN service.delete throw an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const fileRecords = getFileRecords();
				const requestParams = getRequestParams();

				spy = jest.spyOn(service, 'delete').mockRejectedValue(new Error('bla'));
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { requestParams, fileRecords };
			};

			it('should pass the error', async () => {
				const { requestParams } = setup();

				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN valid files exists', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const fileRecords = getFileRecords();
				const requestParams = getRequestParams();

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([
					fileRecords,
					fileRecords.length,
				]);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { requestParams, fileRecords };
			};

			it('should call repo method findBySchoolIdAndParentIdAndMarkedForDelete with correct params', async () => {
				const { requestParams } = setup();

				await service.restoreFilesOfParent(requestParams);

				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should call service restore with correct params', async () => {
				const { requestParams, fileRecords } = setup();

				await service.restoreFilesOfParent(requestParams);

				expect(spy).toHaveBeenCalledWith(fileRecords);
			});

			it('should return counted fileRecords', async () => {
				const { requestParams, fileRecords } = setup();

				const result = await service.restoreFilesOfParent(requestParams);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN no files exits', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const requestParams = getRequestParams();

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([[], 0]);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { requestParams };
			};

			it('should skip service restore call', async () => {
				const { requestParams } = setup();

				await service.restoreFilesOfParent(requestParams);

				expect(spy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN repository throw an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const requestParams = getRequestParams();
				const error = new Error('bla');

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockRejectedValueOnce(error);
				spy = jest.spyOn(service, 'restore').mockResolvedValueOnce();

				return { requestParams, error };
			};

			it('should skip service restore call', async () => {
				const { requestParams, error } = setup();

				await expect(service.restoreFilesOfParent(requestParams)).rejects.toThrowError(error);
			});
		});

		describe('WHEN repository throw an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const fileRecords = getFileRecords();
				const requestParams = getRequestParams();
				const error = new Error('bla');

				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValueOnce([fileRecords, 3]);
				spy = jest.spyOn(service, 'restore').mockRejectedValueOnce(error);

				return { requestParams, error };
			};

			it('should skip service restore call', async () => {
				const { requestParams, error } = setup();

				await expect(service.restoreFilesOfParent(requestParams)).rejects.toThrowError(error);
			});
		});
	});
});
