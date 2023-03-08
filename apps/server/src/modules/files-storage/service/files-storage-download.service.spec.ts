import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType, ScanStatus } from '../entity';
import { ErrorType } from '../error';
import { createPath } from '../helper';
import { IGetFileResponse } from '../interface';
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

describe('FilesStorageService download methods', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let storageClient: DeepMocked<S3ClientAdapter>;
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

	describe('download is called', () => {
		let spy: jest.SpyInstance;

		afterEach(() => {
			spy.mockRestore();
		});

		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};

				const expectedResponse = createMock<IGetFileResponse>();

				spy = jest.spyOn(service, 'downloadFile').mockResolvedValueOnce(expectedResponse);

				return { fileRecord, params, expectedResponse };
			};

			it('calls downloadFile with correct params', async () => {
				const { fileRecord, params } = setup();

				await service.download(fileRecord, params);

				expect(service.downloadFile).toHaveBeenCalledWith(fileRecord.schoolId, fileRecord.id, undefined);
			});

			it('returns correct response', async () => {
				const { fileRecord, params, expectedResponse } = setup();

				const response = await service.download(fileRecord, params);

				expect(response).toEqual(expectedResponse);
			});
		});

		describe('WHEN param file name is not matching found file name', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const paramsFileName = 'paramsFileName';
				const params = {
					fileRecordId: fileRecord.id,
					fileName: paramsFileName,
				};

				spy = jest.spyOn(service, 'downloadFile');

				return { fileRecord, params };
			};

			it('throws error', async () => {
				const { fileRecord, params } = setup();

				const error = new NotFoundException(ErrorType.FILE_NOT_FOUND);

				await expect(service.download(fileRecord, params)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN file records scan status is BLOCKED', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				fileRecord.securityCheck.status = ScanStatus.BLOCKED;
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};

				jest.spyOn(service, 'downloadFile');

				return { fileRecord, params };
			};

			it('throws error', async () => {
				const { fileRecord, params } = setup();

				const error = new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);

				await expect(service.download(fileRecord, params)).rejects.toThrow(error);
				expect(service.downloadFile).toBeCalledTimes(0);
			});
		});

		describe('WHEN download throws error', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const params = {
					fileRecordId: fileRecord.id,
					fileName: fileRecord.name,
				};
				const error = new Error('test');

				spy = jest.spyOn(service, 'downloadFile').mockRejectedValueOnce(error);

				return { fileRecord, params, error };
			};
			it('passes error', async () => {
				const { fileRecord, params, error } = setup();

				await expect(service.download(fileRecord, params)).rejects.toThrowError(error);
			});
		});
	});

	describe('downloadFile is called', () => {
		describe('WHEN file is downloaded successfully', () => {
			const setup = () => {
				const { fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];

				const expectedResponse = createMock<IGetFileResponse>();

				storageClient.get.mockResolvedValueOnce(expectedResponse);

				return { fileRecord, expectedResponse };
			};

			it('calls get with correct params', async () => {
				const { fileRecord } = setup();

				const path = createPath(fileRecord.schoolId, fileRecord.id);

				await service.downloadFile(fileRecord.schoolId, fileRecord.id);

				expect(storageClient.get).toHaveBeenCalledWith(path, undefined);
			});

			it('returns correct response', async () => {
				const { fileRecord, expectedResponse } = setup();

				const response = await service.downloadFile(fileRecord.schoolId, fileRecord.id);

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

				await expect(service.downloadFile(fileRecord.schoolId, fileRecord.id)).rejects.toThrowError(error);
			});
		});
	});
});
