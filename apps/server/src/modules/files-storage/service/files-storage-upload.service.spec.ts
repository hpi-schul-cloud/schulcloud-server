import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Readable } from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileDto } from '../dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { ErrorType } from '../error';
import { createFileRecord, createPath, resolveFileNameDuplicates } from '../helper';
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

describe('FilesStorageService upload methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;
	let configService: DeepMocked<ConfigService>;
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
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		antivirusService = module.get(AntivirusService);
		configService = module.get(ConfigService);
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

	describe('createFileInStorageAndRollbackOnError is called', () => {
		describe('storage client creates file successfully', () => {
			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<FileDto>();

				return { params, fileRecord, fileDescription };
			};

			it('should call client storage create with correct params', async () => {
				const { params, fileRecord, fileDescription } = setup();

				await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				const filePath = createPath(params.schoolId, fileRecord.id);

				expect(storageClient.create).toHaveBeenCalledWith(filePath, fileDescription);
			});

			it('should return file record', async () => {
				const { params, fileRecord, fileDescription } = setup();

				const result = await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('storage client throws error', () => {
			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<FileDto>();
				const error = new Error('test');

				storageClient.create.mockRejectedValueOnce(error);

				return { params, fileRecord, fileDescription, error };
			};

			it('should not call antivirus service', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(antivirusService.send).toHaveBeenCalledTimes(0);
			});

			it('should call file record repo delete', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('file record is send to antivirus successfully', () => {
			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<FileDto>();

				return { params, fileRecord, fileDescription };
			};

			it('should call anitvirus send with correct params', async () => {
				const { params, fileRecord, fileDescription } = setup();

				await service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

				expect(antivirusService.send).toHaveBeenCalledWith(fileRecord);
			});
		});

		describe('antivirus throws error', () => {
			const setup = () => {
				const { params, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileDescription = createMock<FileDto>();
				const error = new Error('test');

				antivirusService.send.mockImplementation(() => {
					throw error;
				});

				return { params, fileRecord, fileDescription, error };
			};

			it('should call file record repo delete', async () => {
				const { params, fileRecord, fileDescription, error } = setup();

				await expect(
					service.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription)
				).rejects.toThrow(error);

				expect(fileRecordRepo.delete).toHaveBeenCalledWith(fileRecord);
			});
		});
	});

	describe('uploadFile is called', () => {
		let getSpy: jest.SpyInstance;
		let trySpy: jest.SpyInstance;

		beforeEach(() => {
			configService.get.mockReturnValue(2560000000);
		});

		afterEach(() => {
			getSpy.mockRestore();
			trySpy.mockRestore();
		});

		const createUploadFileParams = () => {
			const { params, fileRecords, parentId: userId } = buildFileRecordsWithParams();

			const file = createMock<FileDto>();
			file.data = Readable.from('abc');
			file.name = fileRecords[0].name;
			file.size = 122;
			file.mimeType = 'mimeType';

			const fileRecord = createFileRecord(file.name, file.size, file.mimeType, params, userId);

			const { securityCheck, ...expectedFileRecord } = fileRecord;
			expectedFileRecord.name = resolveFileNameDuplicates(fileRecord.name, fileRecords);

			return { params, file, userId, fileRecord, expectedFileRecord, fileRecords };
		};

		describe('WHEN storage client creates file successfully', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, file, userId, fileRecord, expectedFileRecord };
			};

			it('should call getFileRecordsOfParent with correct params', async () => {
				const { params, file, userId } = setup();

				await service.uploadFile(userId, params, file);

				expect(service.getFileRecordsOfParent).toHaveBeenCalledWith(params);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call save and createFileInStorageAndRollbackOnError', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file record repo saves successfully', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, file, userId, fileRecord, expectedFileRecord };
			};

			it('should call fileRecordRepo save with correct params', async () => {
				const { params, file, userId, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, file);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					})
				);
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, fileRecords } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				fileRecordRepo.save.mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call createFileInStorageAndRollbackOnError', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file is successfully created in storage', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, file, userId, fileRecord, expectedFileRecord };
			};

			it('should call createFileInStorageAndRollbackOnError with correct params', async () => {
				const { params, file, userId, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, file);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
					params,
					file
				);
			});
		});

		describe('WHEN createFileInStorageAndRollbackOnError throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, fileRecords } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
			});
		});

		describe('WHEN file is too big', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, fileRecords } = createUploadFileParams();
				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				// TODO: The _id needs to be set here explicitly because it is otherwise not set. Maybe one should mock fileRecordRepo.save to set the _id, which is not trivial though.
				fileRecord._id = new ObjectId();
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				configService.get.mockReturnValueOnce(1);
				const error = new BadRequestException(ErrorType.FILE_TOO_BIG);

				return { params, file, userId, error };
			};

			it('should throw dedicated error', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
			});
		});
	});
});
