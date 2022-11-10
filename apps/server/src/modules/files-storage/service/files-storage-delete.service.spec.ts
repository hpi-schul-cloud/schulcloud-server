import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { getPaths } from '../helper';
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

describe('FilesStorageService delete methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
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

	describe('delete is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();

				fileRecordRepo.save.mockResolvedValueOnce();

				return { fileRecords };
			};

			it('should call repo save with right parameters', async () => {
				const { fileRecords } = setup();

				await service.delete(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) }),
						expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) }),
						expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) }),
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
				const { fileRecords } = buildFileRecordsWithParams();

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
				const { fileRecords } = buildFileRecordsWithParams();

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
				const { fileRecords, params } = buildFileRecordsWithParams();

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
				const { params } = buildFileRecordsWithParams();

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
				const { params } = buildFileRecordsWithParams();

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
				const { params, fileRecords } = buildFileRecordsWithParams();

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
});
