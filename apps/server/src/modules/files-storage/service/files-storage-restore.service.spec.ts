import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { getPaths, unmarkForDelete } from '../helper';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.markedForDelete().buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-two.txt' }),
		fileRecordFactory.markedForDelete().buildWithId({ parentId, schoolId: parentSchoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId: parentSchoolId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, parentId };
};

describe('FilesStorageService restore methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(S3ClientAdapter);
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

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN valid files exist', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();

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
				const { params } = buildFileRecordsWithParams();

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
				const { params } = buildFileRecordsWithParams();
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
				const { params, fileRecords } = buildFileRecordsWithParams();
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
				const { fileRecords } = buildFileRecordsWithParams();

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
				const { fileRecords } = buildFileRecordsWithParams();

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
				const { fileRecords } = buildFileRecordsWithParams();

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
						expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) }),
						expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) }),
						expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) }),
					])
				);
			});
		});
	});
});
