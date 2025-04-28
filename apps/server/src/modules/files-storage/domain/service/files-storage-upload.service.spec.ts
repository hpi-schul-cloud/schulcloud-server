import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { PassThrough, Readable } from 'stream';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordParamsTestFactory, fileRecordTestFactory, readableStreamWithFileTypeFactory } from '../../testing';
import { FileDto } from '../dto';
import { ErrorType } from '../error';
import { FileRecord, FileRecordSecurityCheck, ScanStatus } from '../file-record.do';
import { FileRecordFactory } from '../file-record.factory';
import { FILE_RECORD_REPO, FileRecordRepo } from '../interface';
import { FilesStorageService } from './files-storage.service';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

describe('FilesStorageService upload methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;
	let configService: DeepMocked<ConfigService>;

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
		storageClient = module.get(FILES_STORAGE_S3_CONNECTION);
		fileRecordRepo = module.get(FILE_RECORD_REPO);
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
			const { parentInfo: params, fileRecords, parentId: userId } = FileRecordParamsTestFactory.build();

			const file = createMock<FileDto>();
			const readable = Readable.from('abc');
			file.data = readable;
			file.name = fileRecords[0].getName();
			file.mimeType = props.mimeType;

			const fileSize = 3;

			const fileRecord = FileRecordFactory.buildFromExternalInput(file.name, 0, file.mimeType, params, userId);
			const expectedFileRecord = fileRecord.getProps();
			expectedFileRecord.name = FileRecord.resolveFileNameDuplicates(fileRecords, fileRecord.getName());
			const detectedMimeType = 'image/tiff';
			expectedFileRecord.mimeType = detectedMimeType;

			const expectedSecurityCheck = new FileRecordSecurityCheck({
				reason: 'No scan result',
				requestToken: undefined,
				status: ScanStatus.ERROR,
				updatedAt: new Date(),
			});

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
				expectedSecurityCheck,
				fileRecords,
				readableStreamWithFileType,
			};
		};

		describe('WHEN file records of parent, file record repo save and get mime type are successfull', () => {
			const setup = () => {
				const {
					params,
					file,
					fileSize,
					userId,
					fileRecord,
					expectedFileRecord,
					expectedSecurityCheck,
					readableStreamWithFileType,
				} = createUploadFileParams();

				const getFileRecordsOfParentSpy = jest
					.spyOn(service, 'getFileRecordsOfParent')
					.mockResolvedValue([[fileRecord], 1]);

				// @ts-expect-error - fileTypeStream is mocked
				const getMimeTypeSpy = jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
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
					expectedSecurityCheck,
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
				fileRecordRepo.save.mockImplementationOnce((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					param = JSON.parse(JSON.stringify(fr)) as FileRecord;

					return Promise.resolve();
				});

				fileRecordRepo.save.mockImplementationOnce((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
				});

				await service.uploadFile(userId, params, file);

				expect(param).toMatchObject({ props: { isUploading: true } });
			});

			it('should call fileRecordRepo.save twice with correct params', async () => {
				const {
					params,
					file,
					fileSize,
					userId,
					readableStreamWithFileType,
					expectedFileRecord,
					expectedSecurityCheck,
				} = setup();

				const result = await service.uploadFile(userId, params, file);
				expectedFileRecord.id = result.id;

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);

				expect(fileRecordRepo.save).toHaveBeenLastCalledWith(
					expect.objectContaining({
						props: {
							...expectedFileRecord,
							mimeType: readableStreamWithFileType.fileType?.mime,
							size: fileSize,
							isUploading: undefined,
							createdAt: expect.any(Date),
							updatedAt: expect.any(Date),
						},
						securityCheck: {
							...expectedSecurityCheck,
							updatedAt: expect.any(Date),
						},
					})
				);
			});

			it('should call storageClient.create with correct params', async () => {
				const { params, file, userId } = setup();

				const fileRecord = await service.uploadFile(userId, params, file);
				const parentInfo = fileRecord.getParentInfo();

				const filePath = [parentInfo.storageLocationId, fileRecord.id].join('/');
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

						expect(antivirusService.send).toHaveBeenCalledWith(fileRecord.getSecurityToken());
					});
				});
			});
		});

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, readableStreamWithFileType } = createUploadFileParams();
				const error = new Error('test');

				jest.spyOn(service, 'getFileRecordsOfParent').mockResolvedValue([[fileRecord], 1]);

				// @ts-expect-error - fileTypeStream is mocked
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

				// @ts-expect-error - fileTypeStream is mocked
				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
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

				// @ts-expect-error - fileTypeStream is mocked
				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
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

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
				});

				// @ts-expect-error - fileTypeStream is mocked
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

				// @ts-expect-error - fileTypeStream is mocked
				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				configService.get.mockReturnValueOnce(false);

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
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
				// @ts-expect-error - fileTypeStream is mocked
				jest.spyOn(FileType, 'fileTypeStream').mockResolvedValueOnce(readableStreamWithFileType);

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
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

				// The fileRecord.id must be set by fileRecordRepo.save. Otherwise createPath fails.
				// eslint-disable-next-line @typescript-eslint/require-await
				fileRecordRepo.save.mockImplementation((fr) => {
					if (fr instanceof FileRecord && !fr.id) {
						const props = fr.getProps();
						props.id = new ObjectId().toHexString();
						fr = fileRecordTestFactory().build(props);
					}

					return Promise.resolve();
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
