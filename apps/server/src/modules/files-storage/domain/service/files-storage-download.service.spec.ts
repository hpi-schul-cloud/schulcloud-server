import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { GetFile, S3ClientAdapter } from '@infra/s3-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ScanStatus } from '../../domain';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { fileRecordTestFactory } from '../../testing';
import { ErrorType } from '../error';
import { FILE_RECORD_REPO, FileRecordRepo } from '../interface';
import { FileResponseBuilder } from '../mapper';
import { FilesStorageService } from './files-storage.service';

const buildFileRecordsWithParams = () => {
	const parentId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = fileRecordTestFactory().buildList(3, { parentId, storageLocationId });

	return { fileRecords, parentId };
};

describe('FilesStorageService download methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let storageClient: DeepMocked<S3ClientAdapter>;

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

	describe('download is called', () => {
		let spy: jest.SpyInstance;

		afterEach(() => {
			spy.mockRestore();
		});

		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileName = fileRecord.getName();

				const fileResponse = createMock<GetFile>();
				const expectedResponse = FileResponseBuilder.build(fileResponse, fileRecord.getName());

				spy = jest.spyOn(service, 'downloadFile').mockResolvedValueOnce(expectedResponse);

				return { fileRecord, fileName, expectedResponse };
			};

			it('calls downloadFile with correct params', async () => {
				const { fileRecord, fileName } = setup();

				await service.download(fileRecord, fileName);

				expect(service.downloadFile).toHaveBeenCalledWith(fileRecord, undefined);
			});

			it('returns correct response', async () => {
				const { fileRecord, fileName, expectedResponse } = setup();

				const response = await service.download(fileRecord, fileName);

				expect(response).toEqual(expectedResponse);
			});
		});

		describe('WHEN param file name is not matching found file name', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileName = 'paramsFileName';

				spy = jest.spyOn(service, 'downloadFile');

				return { fileRecord, fileName };
			};

			it('throws error', async () => {
				const { fileRecord, fileName } = setup();

				const error = new NotFoundException(ErrorType.FILE_NOT_FOUND);

				await expect(service.download(fileRecord, fileName)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN file records scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.updateSecurityCheckStatus(ScanStatus.BLOCKED, 'blocked');
				const fileName = fileRecord.getName();

				jest.spyOn(service, 'downloadFile');

				return { fileRecord, fileName };
			};

			it('throws error', async () => {
				const { fileRecord, fileName } = setup();

				const error = new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);

				await expect(service.download(fileRecord, fileName)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN download throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const fileName = fileRecord.getName();
				const error = new Error('test');

				spy = jest.spyOn(service, 'downloadFile').mockRejectedValueOnce(error);

				return { fileRecord, fileName, error };
			};
			it('passes error', async () => {
				const { fileRecord, fileName, error } = setup();

				await expect(service.download(fileRecord, fileName)).rejects.toThrowError(error);
			});
		});
	});

	describe('downloadFile is called', () => {
		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];

				const fileResponse = createMock<GetFile>();

				storageClient.get.mockResolvedValueOnce(fileResponse);
				const expectedResponse = FileResponseBuilder.build(fileResponse, fileRecord.getName());

				return { fileRecord, expectedResponse };
			};

			it('calls get with correct params', async () => {
				const { fileRecord } = setup();

				const path = fileRecord.createPath();

				await service.downloadFile(fileRecord);

				expect(storageClient.get).toHaveBeenCalledWith(path, undefined);
			});

			it('returns correct response', async () => {
				const { fileRecord, expectedResponse } = setup();

				const response = await service.downloadFile(fileRecord);

				expect(response).toEqual(expectedResponse);
			});
		});

		describe('WHEN get throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const error = new Error('test');

				storageClient.get.mockRejectedValueOnce(error);

				return { fileRecord, error };
			};

			it('passes error', async () => {
				const { fileRecord, error } = setup();

				await expect(service.downloadFile(fileRecord)).rejects.toThrowError(error);
			});
		});
	});
});
