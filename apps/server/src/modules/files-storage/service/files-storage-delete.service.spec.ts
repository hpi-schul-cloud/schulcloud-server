import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { getPaths } from '../helper';
import { FileRecordParentType, StorageLocation } from '../interface';
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

describe('FilesStorageService delete methods', () => {
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

			it('should call storageClient.moveToTrash', async () => {
				const { fileRecords } = setup();
				const paths = getPaths(fileRecords);

				await service.delete(fileRecords);

				expect(storageClient.moveToTrash).toHaveBeenCalledWith(paths);
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

				storageClient.moveToTrash.mockRejectedValueOnce(new Error('bla'));

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
				const { parentId } = params;

				spy = jest.spyOn(service, 'delete');
				fileRecordRepo.findByParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { parentId, fileRecords };
			};

			it('should call delete with correct params', async () => {
				const { fileRecords } = setup();

				await service.deleteFilesOfParent(fileRecords);

				expect(service.delete).toHaveBeenCalledWith(fileRecords);
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
				const { parentId } = params;

				spy = jest.spyOn(service, 'delete');

				return { parentId, fileRecords };
			};

			it('should not call delete', async () => {
				const { fileRecords } = setup();

				await service.deleteFilesOfParent(fileRecords);

				expect(service.delete).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service.delete throw an error', () => {
			let spy: jest.SpyInstance;

			afterEach(() => {
				spy.mockRestore();
			});

			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();
				const { parentId } = params;

				spy = jest.spyOn(service, 'delete').mockRejectedValue(new Error('bla'));
				fileRecordRepo.findByParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { parentId, fileRecords };
			};

			it('should pass the error', async () => {
				const { fileRecords } = setup();

				await expect(service.deleteFilesOfParent(fileRecords)).rejects.toThrow(new Error('bla'));
			});
		});
	});
});
