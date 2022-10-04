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
import { FileRecordParams, SingleFileParams } from '../controller/dto';
import { FilesStorageHelper } from '../helper';
import { FilesStorageService } from './files-storage.service';

describe('FilesStorageService', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let filesStorageHelper: DeepMocked<FilesStorageHelper>;
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

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getFileById is called', () => {
		const getFileRecordWithParms = () => {
			const parentId = new ObjectId().toHexString();
			const parentSchoolId = new ObjectId().toHexString();

			const fileRecord = fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' });
			const params = {
				fileRecordId: fileRecord.id,
			};

			return { params, fileRecord };
		};

		describe('when valid file exists', () => {
			const setup = () => {
				const { params, fileRecord } = getFileRecordWithParms();
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

		describe('when repository throw an error', () => {
			const setup = () => {
				const { params } = getFileRecordWithParms();

				fileRecordRepo.findOneById.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFile(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('delete is called', () => {
		describe('when valid files exists', () => {
			const setup = () => {
				return { fileRecords: getFileRecords() };
			};

			it('should call markForDelete', async () => {
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

			it('should call getPaths', async () => {
				const { fileRecords } = setup();

				await service.delete(fileRecords);

				expect(filesStorageHelper.getPaths).toHaveBeenCalledWith(fileRecords);
			});

			it('should call storageClient.delete', async () => {
				const { fileRecords } = setup();
				const paths = ['1', '2'];
				filesStorageHelper.getPaths.mockReturnValue(paths);

				await service.delete(fileRecords);

				expect(storageClient.delete).toHaveBeenCalledWith(paths);
			});
		});

		describe('when repository throw an error', () => {
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

		describe('when filestorage throw an error', () => {
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
		describe('when valid files exists', () => {
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

		describe('when no files exists', () => {
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

		describe('when repository throw an error', () => {
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

		describe('when service.delete throw an error', () => {
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

			afterAll(() => {
				spy.mockRestore();
			});
		});
	});

	describe('restoreFilesOfParent()', () => {
		let requestParams: FileRecordParams;
		const fileRecords = getFileRecords();
		beforeEach(() => {
			requestParams = {
				schoolId,
				parentId: userId,
				parentType: FileRecordParentType.User,
			};
			fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValue([fileRecords, 1]);
			storageClient.delete.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete()', () => {
			it('should call once', async () => {
				await service.restoreFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.restoreFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreFilesOfParent(requestParams)).rejects.toThrow();
			});
		});

		describe('calls to fileStorageService.delete', () => {
			it('should call with correctly params', async () => {
				const spy = jest.spyOn(service, 'delete');

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledWith(fileRecords);

				spy.mockRestore();
			});

			it('should call with correctly params', async () => {
				const spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([[], 0]);

				await service.deleteFilesOfParent(requestParams);

				expect(service.delete).toHaveBeenCalledTimes(0);

				spy.mockRestore();
			});
		});

		it('should return file records and count', async () => {
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

	describe('restoreOneFile()', () => {
		let requestParams: SingleFileParams;
		const fileRecords = getFileRecords();

		beforeEach(() => {
			requestParams = {
				fileRecordId: new ObjectId().toHexString(),
			};
			fileRecordRepo.findOneByIdMarkedForDelete.mockResolvedValue(fileRecords[0]);
			storageClient.restore.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.restoreOneFile(requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.restoreOneFile(requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledWith(requestParams.fileRecordId);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneByIdMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreOneFile(requestParams)).rejects.toThrow();
			});

			it('should return file response with deletedSince', async () => {
				const fileRecordRes = await service.restoreOneFile(requestParams);
				expect(fileRecordRes).toEqual(expect.objectContaining({ deletedSince: undefined }));
			});
		});
	});
});
