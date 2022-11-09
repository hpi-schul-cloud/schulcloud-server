import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams, SingleFileParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
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

const buildFileRecordWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const parentSchoolId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId, schoolId: parentSchoolId, name: 'text.txt' });
	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord };
};

describe('FilesStorageService get methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
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

	describe('getFileRecord is called', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const { params, fileRecord } = buildFileRecordWithParams();
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
				const { params } = buildFileRecordWithParams();

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
				const { fileRecord } = buildFileRecordWithParams();
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
				const { params, fileRecord } = buildFileRecordWithParams();
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
				const { params } = buildFileRecordWithParams();

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
				const { params, fileRecords } = buildFileRecordsWithParams();
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
				const { params } = buildFileRecordsWithParams();

				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValueOnce(new Error('bla'));

				return { params };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(service.getFileRecordsOfParent(params)).rejects.toThrow(new Error('bla'));
			});
		});
	});
});
