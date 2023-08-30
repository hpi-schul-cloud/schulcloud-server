import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import StreamMimeType from 'stream-mime-type-cjs/stream-mime-type-cjs-index';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileDto } from '../dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { ErrorType } from '../error';
import { createFileRecord, resolveFileNameDuplicates } from '../helper';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

jest.mock('stream-mime-type-cjs/stream-mime-type-cjs-index', () => {
	return {
		getMimeType: jest.fn(),
	};
});

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
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		antivirusService = module.get(AntivirusService);
		configService = module.get(ConfigService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		configService.get.mockReturnValue(2560000000);
	});

	afterAll(async () => {
		await module.close();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('uploadFile is called', () => {
		const createUploadFileParams = (props: { mimeType: string } = { mimeType: 'dto-mime-type' }) => {
			const { params, fileRecords, parentId: userId } = buildFileRecordsWithParams();

			const file = createMock<FileDto>();
			const readable = Readable.from('abc');
			file.data = readable;
			file.name = fileRecords[0].name;
			file.mimeType = props.mimeType;

			const fileSize = 3;

			const fileRecord = createFileRecord(file.name, 0, file.mimeType, params, userId);
			const { securityCheck, ...expectedFileRecord } = fileRecord;
			expectedFileRecord.name = resolveFileNameDuplicates(fileRecord.name, fileRecords);
			const detectedMimeType = 'detected-mime-type';
			expectedFileRecord.mimeType = detectedMimeType;

			return {
				params,
				file,
				fileSize,
				userId,
				fileRecord,
				expectedFileRecord,
				fileRecords,
				readable,
				detectedMimeType,
			};
		};

		describe('WHEN file records of parent, file record repo save and get mime type are successfull', () => {
			const setup = () => {
				const { params, file, fileSize, userId, fileRecord, expectedFileRecord, detectedMimeType, readable } =
					createUploadFileParams();

				const getFileRecordsOfParentSpy = jest
					.spyOn(service, 'getFileRecordsOfParent')
					.mockResolvedValue([[fileRecord], 1]);

				const getMimeTypeSpy = jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: detectedMimeType, stream: readable as unknown as undefined });

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				return { params, file, userId, getFileRecordsOfParentSpy, getMimeTypeSpy, fileSize, expectedFileRecord };
			};

			it('should call getMimeType with correct params', async () => {
				const { params, file, userId, getMimeTypeSpy } = setup();

				await service.uploadFile(userId, params, file);

				expect(getMimeTypeSpy).toHaveBeenCalledWith(file.data, { strict: true });
			});

			it('should call getFileRecordsOfParent with correct params', async () => {
				const { params, file, userId, getFileRecordsOfParentSpy } = setup();

				await service.uploadFile(userId, params, file);

				expect(getFileRecordsOfParentSpy).toHaveBeenCalledWith(params.parentId);
			});

			it('should call fileRecordRepo.save twice with correct params', async () => {
				const { params, file, fileSize, userId, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, file);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);

				expect(fileRecordRepo.save).toHaveBeenLastCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						size: fileSize,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					})
				);
			});

			it('should call antivirusService.send with fileRecord', async () => {
				const { params, file, userId } = setup();

				const fileRecord = await service.uploadFile(userId, params, file);

				expect(antivirusService.send).toHaveBeenCalledWith(fileRecord.securityCheck.requestToken);
			});

			it('should call storageClient.create with correct params', async () => {
				const { params, file, userId } = setup();

				const fileRecord = await service.uploadFile(userId, params, file);

				const filePath = [fileRecord.schoolId, fileRecord.id].join('/');
				expect(storageClient.create).toHaveBeenCalledWith(filePath, file);
			});

			it('should return an instance of FileRecord', async () => {
				const { params, file, userId } = setup();

				const result = await service.uploadFile(userId, params, file);

				expect(result).toBeInstanceOf(FileRecord);
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, detectedMimeType, readable } =
					createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: detectedMimeType, stream: readable as unknown as undefined });

				fileRecordRepo.save.mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call storageClient.create', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.create).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN storageClient throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord, detectedMimeType, readable } =
					createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: detectedMimeType, stream: readable as unknown as undefined });

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				storageClient.create.mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and call storageClient.delete and fileRecordRepo.delete', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.delete).toHaveBeenCalled();
				expect(fileRecordRepo.delete).toHaveBeenCalled();
			});
		});

		describe('WHEN file is too big', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, detectedMimeType, readable } = createUploadFileParams();

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: detectedMimeType, stream: readable as unknown as undefined });

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				configService.get.mockReturnValueOnce(1);
				const error = new BadRequestException(ErrorType.FILE_TOO_BIG);

				return { params, file, userId, error };
			};

			it('should pass error and call storageClient.delete and fileRecordRepo.delete', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.delete).toHaveBeenCalled();
				expect(fileRecordRepo.delete).toHaveBeenCalled();
			});
		});

		describe('WHEN antivirusService throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, detectedMimeType, readable } = createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: detectedMimeType, stream: readable as unknown as undefined });

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				antivirusService.send.mockImplementationOnce(() => {
					throw error;
				});

				return { params, file, userId, error };
			};

			it('should pass error and call storageClient.delete and fileRecordRepo.delete', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.delete).toHaveBeenCalled();
				expect(fileRecordRepo.delete).toHaveBeenCalled();
			});
		});

		describe('WHEN getMimeType returns undefined', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readable } = createUploadFileParams();

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest
					.spyOn(StreamMimeType, 'getMimeType')
					.mockResolvedValueOnce({ mime: undefined as unknown as string, stream: readable as unknown as undefined });

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				return { params, file, userId };
			};

			it('should use dto mime type', async () => {
				const { params, file, userId } = setup();

				const fileRecord = await service.uploadFile(userId, params, file);

				expect(fileRecord.mimeType).toEqual(file.mimeType);
			});
		});

		describe('WHEN mime type cant be detected from stream', () => {
			const setup = () => {
				const mimeType = 'image/svg+xml';
				const { params, file, userId, fileRecord } = createUploadFileParams({ mimeType });

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				const getMimeTypeSpy = jest.spyOn(StreamMimeType, 'getMimeType');

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				return { params, file, userId, getMimeTypeSpy, mimeType };
			};

			it('should use dto mime type', async () => {
				const { params, file, userId, mimeType } = setup();

				await service.uploadFile(userId, params, file);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(expect.objectContaining({ mimeType }));
			});

			it('should not detect from stream', async () => {
				const { params, file, userId, getMimeTypeSpy } = setup();

				await service.uploadFile(userId, params, file);

				expect(getMimeTypeSpy).not.toHaveBeenCalled();
			});
		});
	});
});
