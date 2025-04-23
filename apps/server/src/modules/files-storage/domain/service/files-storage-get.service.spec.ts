import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { fileRecordTestFactory } from '../../testing';
import { FILE_RECORD_REPO, FileRecordRepo } from '../interface';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const creatorId = new ObjectId().toHexString();
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = fileRecordTestFactory().buildList(3, { parentId, storageLocationId });

	return { fileRecords, parentId, creatorId };
};

const buildFileRecord = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordTestFactory().build({ parentId, storageLocationId, name: 'text.txt' });

	return { fileRecord };
};

describe('FilesStorageService get methods', () => {
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

	describe('getFileRecord is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecord();
				fileRecordRepo.findOneById.mockResolvedValueOnce(fileRecord);

				return { fileRecord };
			};

			it('should call findOneById', async () => {
				const { fileRecord } = setup();

				await service.getFileRecord(fileRecord.id);

				expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(fileRecord.id);
			});

			it('should return the matched fileRecord', async () => {
				const { fileRecord } = setup();

				const result = await service.getFileRecord(fileRecord.id);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				fileRecordRepo.findOneById.mockRejectedValueOnce(new Error('bla'));

				const fileRecordId = new ObjectId().toHexString();

				return { fileRecordId };
			};

			it('should pass the error', async () => {
				const { fileRecordId } = setup();

				await expect(service.getFileRecord(fileRecordId)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('getFileRecordBySecurityCheckRequestToken is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecord();
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
				const { fileRecord } = buildFileRecord();
				fileRecordRepo.findOneByIdMarkedForDelete.mockResolvedValueOnce(fileRecord);

				return { fileRecord };
			};

			it('should call findOneByIdMarkedForDelete', async () => {
				const { fileRecord } = setup();

				await service.getFileRecordMarkedForDelete(fileRecord.id);

				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledWith(fileRecord.id);
			});

			it('should return the matched fileRecord', async () => {
				const { fileRecord } = setup();

				const result = await service.getFileRecordMarkedForDelete(fileRecord.id);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				fileRecordRepo.findOneByIdMarkedForDelete.mockRejectedValueOnce(new Error('test'));

				const fileRecordId = new ObjectId().toHexString();

				return { fileRecordId };
			};

			it('should pass the error', async () => {
				const { fileRecordId } = setup();

				await expect(service.getFileRecordMarkedForDelete(fileRecordId)).rejects.toThrow(new Error('test'));
			});
		});
	});

	describe('getFileRecordsOfParent is called', () => {
		describe('WHEN valid files exist', () => {
			const setup = () => {
				const { parentId, fileRecords } = buildFileRecordsWithParams();
				fileRecordRepo.findByParentId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { parentId, fileRecords };
			};

			it('should call findBySchoolIdAndParentId with right parameters', async () => {
				const { parentId } = setup();

				await service.getFileRecordsOfParent(parentId);

				expect(fileRecordRepo.findByParentId).toHaveBeenNthCalledWith(1, parentId);
			});

			it('should return the matched fileRecord', async () => {
				const { parentId, fileRecords } = setup();

				const result = await service.getFileRecordsOfParent(parentId);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { parentId } = buildFileRecordsWithParams();

				fileRecordRepo.findByParentId.mockRejectedValueOnce(new Error('bla'));

				return { parentId };
			};

			it('should pass the error', async () => {
				const { parentId } = setup();

				await expect(service.getFileRecordsOfParent(parentId)).rejects.toThrow(new Error('bla'));
			});
		});
	});

	describe('getFileRecordsByCreatorId is called', () => {
		describe('WHEN valid files exist', () => {
			const setup = () => {
				const { fileRecords, creatorId } = buildFileRecordsWithParams();
				fileRecordRepo.findByCreatorId.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { fileRecords, creatorId };
			};

			it('should call fileRecordRepo.findByCreatorId with right parameters', async () => {
				const { creatorId } = setup();

				await service.getFileRecordsByCreatorId(creatorId);

				expect(fileRecordRepo.findByCreatorId).toHaveBeenNthCalledWith(1, creatorId);
			});

			it('should return the matched fileRecord', async () => {
				const { creatorId, fileRecords } = setup();

				const result = await service.getFileRecordsByCreatorId(creatorId);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN repository throws an error', () => {
			const setup = () => {
				const { creatorId } = buildFileRecordsWithParams();

				fileRecordRepo.findByCreatorId.mockRejectedValueOnce(new Error('bla'));

				return { creatorId };
			};

			it('should pass the error', async () => {
				const { creatorId } = setup();

				await expect(service.getFileRecordsByCreatorId(creatorId)).rejects.toThrow(new Error('bla'));
			});
		});
	});
});
