import { createMock, DeepMocked } from '@golevelup/ts-jest';
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
import { createFileRecord, resolveFileNameDuplicates } from '../helper';
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
		configService.get.mockReturnValue(2560000000);
	});

	afterAll(async () => {
		await module.close();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('uploadFile is called', () => {
		const createUploadFileParams = () => {
			const { params, fileRecords, parentId: userId } = buildFileRecordsWithParams();

			const file = createMock<FileDto>();
			file.data = Readable.from('abc');
			file.name = fileRecords[0].name;
			file.mimeType = 'mimeType';

			const fileSize = 3;

			const fileRecord = createFileRecord(file.name, 0, file.mimeType, params, userId);
			const { securityCheck, ...expectedFileRecord } = fileRecord;
			expectedFileRecord.name = resolveFileNameDuplicates(fileRecord.name, fileRecords);

			const getFileRecordsOfParentSpy = jest
				.spyOn(service, 'getFileRecordsOfParent')
				.mockResolvedValue([[fileRecord], 1]);

			// The fileRecord._id must be set by fileRecordRepo.save. Otherwise createPath fails.
			// eslint-disable-next-line @typescript-eslint/require-await
			fileRecordRepo.save.mockImplementation(async (fr) => {
				if (fr instanceof FileRecord && !fr._id) {
					fr._id = new ObjectId();
				}
			});

			return {
				params,
				file,
				fileSize,
				userId,
				fileRecord,
				expectedFileRecord,
				fileRecords,
				getFileRecordsOfParentSpy,
			};
		};

		it('should call getFileRecordsOfParent with correct params', async () => {
			const { params, file, userId, getFileRecordsOfParentSpy } = createUploadFileParams();

			await service.uploadFile(userId, params, file);

			expect(getFileRecordsOfParentSpy).toHaveBeenCalledWith(params);
		});

		it('should call fileRecordRepo.save twice with correct params', async () => {
			const { params, file, fileSize, userId, expectedFileRecord } = createUploadFileParams();

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

		describe('WHEN file record repo throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord } = createUploadFileParams();
				const error = new Error('test');

				fileRecordRepo.save.mockRejectedValueOnce(error);

				return { params, file, userId, fileRecord, expectedFileRecord, error };
			};

			it('should pass error and not call storageClient.create', async () => {
				const { params, file, userId, error } = setup();

				await expect(service.uploadFile(userId, params, file)).rejects.toThrow(error);
				expect(storageClient.create).toHaveBeenCalledTimes(0);
			});
		});

		it('should call storageClient.create with correct params', async () => {
			const { params, file, userId } = createUploadFileParams();

			const fileRecord = await service.uploadFile(userId, params, file);

			const filePath = [fileRecord.schoolId, fileRecord.id].join('/');
			expect(storageClient.create).toHaveBeenCalledWith(filePath, file);
		});

		describe('WHEN storageClient throws error', () => {
			const setup = () => {
				const { params, file, userId, fileRecord, expectedFileRecord } = createUploadFileParams();
				const error = new Error('test');

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
				const { params, file, userId } = createUploadFileParams();

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

		it('should correctly set file size', async () => {
			const { params, file, fileSize, userId } = createUploadFileParams();

			await service.uploadFile(userId, params, file);

			expect(fileRecordRepo.save).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					size: fileSize,
				})
			);
		});

		it('should call antivirusService.send with fileRecord', async () => {
			const { params, file, userId } = createUploadFileParams();

			const fileRecord = await service.uploadFile(userId, params, file);

			expect(antivirusService.send).toHaveBeenCalledWith(fileRecord.securityCheck.requestToken);
		});

		describe('WHEN antivirusService throws error', () => {
			const setup = () => {
				const { params, file, userId } = createUploadFileParams();
				const error = new Error('test');

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

		it('should return an instance of FileRecord', async () => {
			const { params, file, userId } = createUploadFileParams();

			const result = await service.uploadFile(userId, params, file);

			expect(result).toBeInstanceOf(FileRecord);
		});
	});
});
