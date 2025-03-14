import { Logger } from '@core/logger';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { S3ClientAdapter } from '@infra/s3-client';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { FileRecord } from '../entity';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { StorageLocation } from '../interface';
import { FileRecordRepo } from '../repo';
import { FilesStorageAdminService } from './files-storage-admin.service';

describe(FilesStorageAdminService.name, () => {
	let module: TestingModule;
	let service: FilesStorageAdminService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageAdminService,
				{
					provide: FILES_STORAGE_S3_CONNECTION,
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

		service = module.get(FilesStorageAdminService);
		storageClient = module.get(FILES_STORAGE_S3_CONNECTION);
		fileRecordRepo = module.get(FileRecordRepo);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('deleteByStorageLocation', () => {
		const setup = () => {
			const storageLocation = StorageLocation.SCHOOL;
			const storageLocationId = new ObjectId().toHexString();
			const params = { storageLocation, storageLocationId };

			fileRecordRepo.markForDeleteByStorageLocation.mockResolvedValue(1);

			return { storageLocation, storageLocationId, params };
		};

		it('should fileRecordRepo.markForDeleteByStorageLocation', async () => {
			const { storageLocation, storageLocationId, params } = setup();

			await service.deleteByStorageLocation(params);

			expect(fileRecordRepo.markForDeleteByStorageLocation).toBeCalledWith(storageLocation, storageLocationId);
		});

		it('should storageClient.moveDirectoryToTrash', async () => {
			const { storageLocationId, params } = setup();

			await service.deleteByStorageLocation(params);

			expect(storageClient.moveDirectoryToTrash).toBeCalledWith(storageLocationId);
		});

		it('should return result', async () => {
			const { params } = setup();

			const resultValue = await service.deleteByStorageLocation(params);

			expect(resultValue).toBe(1);
		});
	});
});
