import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import type { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILE_STORAGE_CLIENT_CONFIG_TOKEN } from './files-storage-client.config';
import { FileApi } from './generated';
import { fileRecordResponseFactory } from './testing';

describe(FilesStorageClientAdapter.name, () => {
	let module: TestingModule;
	let filesStorageClientAdapter: FilesStorageClientAdapter;
	let fileApiMock: DeepMocked<FileApi>;
	let loggerMock: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: FileApi,
					useValue: createMock<FileApi>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ErrorLogger,
					useValue: createMock<ErrorLogger>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: FILE_STORAGE_CLIENT_CONFIG_TOKEN,
					useValue: {
						basePath: faker.internet.url(),
					},
				},
				{
					provide: REQUEST,
					useValue: createMock<Request>({
						headers: {
							authorization: `Bearer ${faker.string.alphanumeric(42)}`,
						},
					}),
				},
			],
		}).compile();

		loggerMock = module.get(Logger);
		fileApiMock = module.get(FileApi);

		filesStorageClientAdapter = new FilesStorageClientAdapter(fileApiMock, loggerMock, module.get(REQUEST));
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(filesStorageClientAdapter).toBeDefined();
	});

	describe('getFileRecord', () => {
		describe('when fetching file records', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileRecord = fileRecordResponseFactory.build();

				fileApiMock.getFileRecord.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecord }));

				return { fileRecordId, fileRecord };
			};

			it('should delegate to fileApi', async () => {
				const { fileRecordId, fileRecord } = setup();

				const result = await filesStorageClientAdapter.getFileRecord(fileRecordId);

				expect(fileApiMock.getFileRecord).toHaveBeenCalledWith(fileRecordId);
				expect(result).toStrictEqual(fileRecord);
			});
		});
	});
});
