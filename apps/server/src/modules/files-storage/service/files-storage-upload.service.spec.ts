import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { readableStreamWithFileTypeFactory } from '@shared/testing/factory/readable-stream-with-file-type.factory';
import { LegacyLogger } from '@src/core/logger';
import { MimeType } from 'file-type';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { PassThrough, Readable } from 'stream';
import { FileRecordParams } from '../controller/dto';
import { FileDto } from '../dto';
import { FileRecord, FileRecordParentType, StorageLocation } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createFileRecord, resolveFileNameDuplicates } from '../helper';
import { FileRecordRepo } from '../repo';
import { FilesStorageService } from './files-storage.service';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

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
			const detectedMimeType: MimeType = 'image/tiff';
			expectedFileRecord.mimeType = detectedMimeType;

			const readableStreamWithFileType = readableStreamWithFileTypeFactory.build();

			antivirusService.checkStream.mockResolvedValueOnce({
				virus_detected: undefined,
				virus_signature: undefined,
				error: undefined,
			});

			return {
				params,
				file,
				fileSize,
				userId,
				fileRecord,
				expectedFileRecord,
				fileRecords,
				readableStreamWithFileType,
			};
		};

		describe('WHEN file records of parent, file record repo save and get mime type are successfull', () => {
			const setup = () => {
				const { params, file, fileSize, userId, fileRecord, expectedFileRecord, readableStreamWithFileType } =
					createUploadFileParams();

				const getFileRecordsOfParentSpy = jest
					.spyOn(service, 'getFileRecordsOfParent')
					.mockResolvedValue([[fileRecord], 1]);

				const getMimeTypeSpy = jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}

					return Promise.resolve();
				});

				return {
					params,
					file,
					userId,
					getFileRecordsOfParentSpy,
					getMimeTypeSpy,
					fileSize,
					readableStreamWithFileType,
					expectedFileRecord,
				};
			};

			it('should call getMimeType with correct params', async () => {
				const { params, file, userId, getMimeTypeSpy } = setup();

				await service.uploadFile(userId, params, file);

				expect(getMimeTypeSpy).toHaveBeenCalledWith(expect.any(PassThrough));
			});

			it('should call getFileRecordsOfParent with correct params', async () => {
				const { params, file, userId, getFileRecordsOfParentSpy } = setup();

				await service.uploadFile(userId, params, file);

				expect(getFileRecordsOfParentSpy).toHaveBeenCalledWith(params.parentId);
			});

			it('should call fileRecordRepo.save in first call with isUploading: true', async () => {
				const { params, file, userId } = setup();

				// haveBeenCalledWith can't be use here because fileRecord is a reference and
				// it will always compare the final state of the object
				let param: FileRecord | undefined;

				fileRecordRepo.save.mockReset();
				fileRecordRepo.save.mockImplementationOnce(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}

					param = JSON.parse(JSON.stringify(fr)) as FileRecord;

					return Promise.resolve();
				});

				fileRecordRepo.save.mockImplementationOnce(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}

					return Promise.resolve();
				});

				await service.uploadFile(userId, params, file);

				expect(param).toMatchObject({ isUploading: true });
			});

			it('should call fileRecordRepo.save twice with correct params', async () => {
				const { params, file, fileSize, userId, readableStreamWithFileType, expectedFileRecord } = setup();

				await service.uploadFile(userId, params, file);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);

				expect(fileRecordRepo.save).toHaveBeenLastCalledWith(
					expect.objectContaining({
						...expectedFileRecord,
						mimeType: readableStreamWithFileType.fileType?.mime,
						size: fileSize,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						isUploading: undefined,
					})
				);
			});

			it('should call storageClient.create with correct params', async () => {
				const { params, file, userId } = setup();

				const fileRecord = await service.uploadFile(userId, params, file);

				const filePath = [fileRecord.storageLocationId, fileRecord.id].join('/');
				expect(storageClient.create).toHaveBeenCalledWith(filePath, file);
			});

			it('should return an instance of FileRecord', async () => {
				const { params, file, userId } = setup();

				const result = await service.uploadFile(userId, params, file);

				expect(result).toBeInstanceOf(FileRecord);
			});

			describe('Antivirus handling by upload ', () => {
				describe('when useStreamToAntivirus is true', () => {
					it('should call antivirusService.send with fileRecord', async () => {
						const { params, file, userId } = setup();
						configService.get.mockReturnValueOnce(true);
						await service.uploadFile(userId, params, file);

						expect(antivirusService.checkStream).toHaveBeenCalledWith(file);
					});
				});

				describe('when useStreamToAntivirus is false', () => {
					it('should call antivirusService.send with fileRecord', async () => {
						const { params, file, userId } = setup();
						configService.get.mockReturnValueOnce(false);

						const fileRecord = await service.uploadFile(userId, params, file);

						expect(antivirusService.send).toHaveBeenCalledWith(fileRecord.securityCheck.requestToken);
					});
				});
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				fileRecordRepo.save.mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, error };
			};

			it('should pass error and not call storageClient.create', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.create).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN storageClient throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				storageClient.create.mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, error };
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
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				configService.get.mockReturnValueOnce(true);
				configService.get.mockReturnValueOnce(2);
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

		describe('WHEN file size is bigger than maxSecurityCheckFileSize', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				// Mock for useStreamToAntivirus
				configService.get.mockReturnValueOnce(false);

				// Mock for max file size
				configService.get.mockReturnValueOnce(10);

				// Mock for max security check file size
				configService.get.mockReturnValueOnce(2);

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				return { params, file, userId };
			};

			it('should call save with WONT_CHECK status', async () => {
				const { params, file, userId } = setup();

				await service.uploadFile(userId, params, file);

				expect(fileRecordRepo.save).toHaveBeenNthCalledWith(
					1,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					expect.objectContaining({ securityCheck: expect.objectContaining({ status: 'wont_check' }) })
				);
			});

			it('should not call antivirus send', async () => {
				const { params, file, userId } = setup();

				await service.uploadFile(userId, params, file);

				expect(antivirusService.send).not.toHaveBeenCalled();
			});
		});

		describe('WHEN antivirusService throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				configService.get.mockReturnValueOnce(false);

				// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation(async (fr) => {
					if (fr instanceof FileRecord && !fr._id) {
						fr._id = new ObjectId();
					}
				});

				antivirusService.send.mockRejectedValueOnce(error);

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
				const { params, file, userId, fileRecord } = createUploadFileParams();

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				const readableStreamWithFileType = readableStreamWithFileTypeFactory.build({ fileType: undefined });
				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

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

				const getMimeTypeSpy = jest.spyOn(FileType, 'fileTypeStream');

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
