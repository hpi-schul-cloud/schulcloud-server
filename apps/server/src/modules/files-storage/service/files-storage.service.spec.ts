import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { RenameFileParams } from '../controller/dto';
import { FilesStorageHelper } from '../helper';
import { FilesStorageService } from './files-storage.service';

describe('FilesStorageService', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	// TODO: should we really mock the helper?
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
					provide: FilesStorageHelper,
					useValue: createMock<FilesStorageHelper>(),
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

	describe('GIVEN getFileById is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { params, fileRecord } = getFileRecordWithParams();
				fileRecordRepo.findOneById.mockResolvedValueOnce(fileRecord);

				return { params, fileRecord };
			};

			it('THEN it should call findOneById', async () => {
				const { params } = setup();

				await service.getFile(params);

				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('THEN it should return the matched fileRecord', async () => {
				const { params, fileRecord } = setup();

				const result = await service.getFile(params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throw an error', () => {
			const setup = () => {
				const { params } = getFileRecordWithParams();

				fileRecordRepo.findOneById.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('THEN it should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFile(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('GIVEN getFilesOfParent is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { params, fileRecords } = getFileRecordsWithParams();
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, fileRecords };
			};

			it('THEN it should call findBySchoolIdAndParentId with right parameters', async () => {
				const { params } = setup();

				await service.getFilesOfParent(params);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(1, params.schoolId, params.parentId);
			});

			it('THEN it should return the matched fileRecord', async () => {
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

			it('THEN it should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFilesOfParent(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('GIVEN patchFilename is called', () => {
		describe('WHEN file(s) exists and valid params are passed', () => {
			const setup = () => {
				const { fileRecords, params } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const data: RenameFileParams = { fileName: 'renamed' };

				const spyGetFilesOfParent = jest.spyOn(service, 'getFilesOfParent').mockResolvedValueOnce([fileRecords, 1]);

				return {
					data,
					fileRecord,
					fileRecords,
					params,
					spyGetFilesOfParent,
				};
			};

			it('THEN it should call getFilesOfParent with right paramaters', async () => {
				const { fileRecord, data, spyGetFilesOfParent, params } = setup();

				await service.patchFilename(fileRecord, data);

				expect(spyGetFilesOfParent).toHaveBeenCalledWith(params);
			});

			it('THEN it should call filesStorageHelper.modifiedFileNameInScope with right paramaters', async () => {
				const { fileRecord, fileRecords, data } = setup();

				await service.patchFilename(fileRecord, data);

				expect(filesStorageHelper.modifiedFileNameInScope).toHaveBeenCalledWith(fileRecord, fileRecords, data.fileName);
			});

			it('THEN it should call fileRecordRepo.save with right paramaters', async () => {
				const { fileRecord, data } = setup();

				await service.patchFilename(fileRecord, data);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});

			it('THEN it should return modified fileRecord', async () => {
				const { fileRecord, data } = setup();

				const result = await service.patchFilename(fileRecord, data);

				expect(result.name).toEqual(data.fileName);
			});
		});

		describe('WHEN repository is throw an error', () => {
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

			it('THEN it should pass the error', async () => {
				const { fileRecord, data } = setup();

				await expect(service.patchFilename(fileRecord, data)).rejects.toThrowError(new Error('bla'));
			});
		});
	});

	describe('GIVEN delete is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				return { fileRecords: getFileRecords() };
			};

			it('THEN it should call markForDelete', async () => {
				const { fileRecords } = setup();
				await service.delete(fileRecords);

				expect(filesStorageHelper.markForDelete).toHaveBeenCalledWith(fileRecords);
			});

			it('should call fileRecordRepo.save with marked file records', async () => {
				const { fileRecords: markedFileRecords } = setup();
				const fileRecords = [];

				filesStorageHelper.markForDelete.mockReturnValue(markedFileRecords);

				await service.delete(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(1, markedFileRecords);
			});

			it('THEN it should call getPaths', async () => {
				const { fileRecords } = setup();

				await service.delete(fileRecords);

				expect(filesStorageHelper.getPaths).toHaveBeenCalledWith(fileRecords);
			});

			it('THEN it should call storageClient.delete', async () => {
				const { fileRecords } = setup();
				const paths = ['1', '2'];
				filesStorageHelper.getPaths.mockReturnValue(paths);

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

			it('THEN it should pass the error', async () => {
				const { fileRecords } = setup();

				await expect(service.delete(fileRecords)).rejects.toThrow(new Error('bla'));
			});
		});

		describe('WHEN filestorage throw an error', () => {
			const setup = () => {
				storageClient.delete.mockRejectedValueOnce(new Error('bla'));

				return { fileRecords: getFileRecords() };
			};

			it('THEN it should throw error if entity not found', async () => {
				const { fileRecords } = setup();

				await expect(service.delete(fileRecords)).rejects.toThrow(new InternalServerErrorException('bla'));
				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(2, fileRecords);
			});
		});
	});

	describe('GIVEN deleteFilesOfParent is called', () => {
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

			it('THEN it should call findBySchoolIdAndParentId onces with correctly params', async () => {
				const { requestParams } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenNthCalledWith(
					1,
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('THEN it should call delete with correct params', async () => {
				const { requestParams, fileRecords } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledWith(fileRecords);
			});

			it('THEN it should return file records and count', async () => {
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

			it('THEN it should not call delete', async () => {
				const { requestParams } = setup();

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledTimes(0);
			});

			it('THEN it should return empty counted type', async () => {
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

			it('THEN it should pass the error', async () => {
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

			it('THEN it should pass the error', async () => {
				const { requestParams } = setup();

				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('restoreFilesOfParent()', () => {
		let spy: jest.SpyInstance;

		afterEach(() => {
			spy.mockRestore();
		});

		const setup = () => {
			const fileRecords = getFileRecords();
			const requestParams = getRequestParams();

			spy = jest.spyOn(service, 'restore');
			fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValue([fileRecords, 3]);

			return { requestParams, fileRecords };
		};

		describe('calls to fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete()', () => {
			it('should call once', async () => {
				const { requestParams } = setup();
				await service.restoreFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				const { requestParams } = setup();
				await service.restoreFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should throw error if entity not found', async () => {
				const { requestParams } = setup();
				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreFilesOfParent(requestParams)).rejects.toThrow();
			});
		});

		describe('calls to fileStorageService.restore', () => {
			it('should call with correctly params', async () => {
				const { requestParams, fileRecords } = setup();

				await service.restoreFilesOfParent(requestParams);

				expect(spy).toHaveBeenCalledWith(fileRecords);
			});

			it('should call with correctly params', async () => {
				const { requestParams } = setup();
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([[], 0]);

				await service.restoreFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledTimes(0);

				spy.mockRestore();
			});
		});

		it('should return file records and count', async () => {
			const { requestParams, fileRecords } = setup();
			const responseData = await service.restoreFilesOfParent(requestParams);
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

	describe('restoreOneFile()', () => {
		const setup = () => {
			const fileRecords = getFileRecords();
			const requestParams = {
				fileRecordId: new ObjectId().toHexString(),
			};

			fileRecordRepo.findOneByIdMarkedForDelete.mockResolvedValue(fileRecords[0]);

			return { requestParams, fileRecords };
		};

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('when call once', async () => {
				const { requestParams } = setup();
				await service.restoreOneFile(requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				const { requestParams } = setup();
				await service.restoreOneFile(requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledWith(requestParams.fileRecordId);
			});

			it('should throw error if entity not found', async () => {
				const { requestParams } = setup();
				fileRecordRepo.findOneByIdMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreOneFile(requestParams)).rejects.toThrow();
			});

			it('should return file response with deletedSince', async () => {
				const { requestParams } = setup();
				const fileRecordRes = await service.restoreOneFile(requestParams);
				expect(fileRecordRes).toEqual(expect.objectContaining({ deletedSince: undefined }));
			});
		});
	});
});
