import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { fileRecordTestFactory } from '../domain';
import { FileDto } from '../dto';
import { createPath, resolveFileNameDuplicates } from '../helper';
import { FileRecordParentType } from '../interface';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordTestFactory.build({ parentId, schoolId, name: 'text.txt' }),
		fileRecordTestFactory.build({ parentId, schoolId, name: 'text-two.txt' }),
		fileRecordTestFactory.build({ parentId, schoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId,
		parentId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, parentId };
};

describe('FilesStorageService upload methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	// TODO: change to defined interface
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;

	beforeAll(async () => {
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
		antivirusService = module.get(AntivirusService);
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

		afterEach(() => {
			getSpy.mockRestore();
			trySpy.mockRestore();
		});

		const createUploadFileParams = () => {
			const { params, fileRecords, parentId: userId } = buildFileRecordsWithParams();

			const name = fileRecords[0].getName();
			const size = 122;
			const mimeType = 'mimeType';
			const { parentId, parentType, schoolId } = params;

			const fileDescription = createMock<FileDto>();
			fileDescription.name = name;
			fileDescription.size = size;
			fileDescription.mimeType = mimeType;

			const newName = resolveFileNameDuplicates(name, fileRecords);

			const fileRecord = fileRecordTestFactory.build({
				creatorId: userId,
				name: newName,
				size,
				mimeType,
				parentType,
				parentId,
				schoolId,
			});

			return { params, fileDescription, userId, fileRecord, fileRecords };
		};

		describe('WHEN storage client creates file successfully', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord };
			};

			it('should call getFileRecordsOfParent with correct params', async () => {
				const { params, fileDescription, userId } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(service.getFileRecordsOfParent).toHaveBeenCalledWith(params);
			});
		});

		describe('WHEN storage client throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, error };
			};

			it('should pass error and not call save and createFileInStorageAndRollbackOnError', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);

				expect(fileRecordRepo.create).toHaveBeenCalledTimes(0);
				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file record repo saves successfully', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord };
			};

			it('should call fileRecordRepo save with correct params', async () => {
				const { params, fileDescription, userId, fileRecord } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(fileRecordRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						...fileRecord.getProps(),
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					})
				);
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, fileRecords } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				fileRecordRepo.create.mockRejectedValueOnce(error);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord, error };
			};

			it('should pass error and not call createFileInStorageAndRollbackOnError', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN file is successfully created in storage', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, fileRecords } = createUploadFileParams();

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockResolvedValueOnce(fileRecord);

				return { params, fileDescription, userId, fileRecord };
			};

			it('should call createFileInStorageAndRollbackOnError with correct params', async () => {
				const { params, fileDescription, userId, fileRecord } = setup();

				await service.uploadFile(userId, params, fileDescription);

				expect(service.createFileInStorageAndRollbackOnError).toHaveBeenCalledWith(
					expect.objectContaining({
						...fileRecord.getProps(),
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
					params,
					fileDescription
				);
			});
		});

		describe('WHEN tryToCreateFileInStorage throws error', () => {
			const setup = () => {
				const { params, fileDescription, userId, fileRecord, fileRecords } = createUploadFileParams();
				const error = new Error('test');

				getSpy = jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValueOnce([fileRecords, 1]);
				fileRecordRepo.create.mockResolvedValueOnce([fileRecord]);
				trySpy = jest.spyOn(service, 'createFileInStorageAndRollbackOnError').mockRejectedValueOnce(error);

				return { params, fileDescription, userId, fileRecord, error };
			};

			it('should pass error', async () => {
				const { params, fileDescription, userId, error } = setup();

				await expect(service.uploadFile(userId, params, fileDescription)).rejects.toThrow(error);
			});
		});
	});
});
