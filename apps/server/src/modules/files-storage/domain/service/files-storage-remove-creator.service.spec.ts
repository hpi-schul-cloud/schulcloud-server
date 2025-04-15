import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParams } from '../../api/dto'; // TODO: invalid import
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { fileRecordTestFactory } from '../../testing';
import { FILE_RECORD_REPO, FileRecordParentType, FileRecordRepo, StorageLocation } from '../interface';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();
	const creatorId = new ObjectId().toHexString();

	const fileRecords = fileRecordTestFactory().buildList(3, { parentId, storageLocationId });

	const params: FileRecordParams = {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, parentId, creatorId };
};

describe('FilesStorageService delete methods', () => {
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

	describe('removeCreatorIdFromFileRecord is called', () => {
		describe('WHEN valid files exists', () => {
			const setup = () => {
				const { fileRecords, creatorId } = buildFileRecordsWithParams();

				fileRecordRepo.findByCreatorId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { fileRecords, creatorId };
			};

			it('should call repo save with undefined creatorId', async () => {
				const { fileRecords } = setup();

				await service.removeCreatorIdFromFileRecords(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecords[0], creatorId: undefined }),
						expect.objectContaining({ ...fileRecords[1], creatorId: undefined }),
						expect.objectContaining({ ...fileRecords[2], creatorId: undefined }),
					])
				);
			});

			it('should getnumber of updated fileRecords', async () => {
				const { fileRecords } = setup();

				const result = await service.removeCreatorIdFromFileRecords(fileRecords);

				result.forEach((entity) => {
					expect(entity.creatorId).toBe(undefined);
				});
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
	});
});
