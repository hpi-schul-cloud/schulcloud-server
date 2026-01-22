import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import type { Request } from 'express';
import { Readable } from 'node:stream';
import { from, throwError } from 'rxjs';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILE_STORAGE_CLIENT_CONFIG_TOKEN, FileStorageClientConfig } from './files-storage-client.config';
import { FileApi, FileRecordParentType, StorageLocation } from './generated';

describe(FilesStorageClientAdapter.name, () => {
	let module: TestingModule;
	let filesStorageClientAdapter: FilesStorageClientAdapter;
	let httpServiceMock: DeepMocked<HttpService>;
	let errorLoggerMock: DeepMocked<ErrorLogger>;
	let config: FileStorageClientConfig;
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
		errorLoggerMock = module.get(ErrorLogger);
		httpServiceMock = module.get(HttpService);
		config = module.get(FILE_STORAGE_CLIENT_CONFIG_TOKEN);

		filesStorageClientAdapter = new FilesStorageClientAdapter(
			loggerMock,
			errorLoggerMock,
			httpServiceMock,
			config,
			module.get(REQUEST)
		);
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

	describe('getStream', () => {
		describe('when download succeeds', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = from([axiosResponseFactory.build({ data: Readable.from('') })]);

				httpServiceMock.get.mockReturnValue(observable);

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return the response stream', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await filesStorageClientAdapter.getStream(fileRecordId, fileName);

				expect(result).toBeDefined();
				expect(httpServiceMock.get).toBeCalledWith(expect.any(String), {
					responseType: 'stream',
					headers: {
						Authorization: expect.any(String),
					},
				});
			});
		});

		describe('when download fails', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = throwError(() => new Error('error'));

				httpServiceMock.get.mockReturnValue(observable);

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return null', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await filesStorageClientAdapter.getStream(fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalled();
			});
		});

		describe('when download does not return a stream', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = from([axiosResponseFactory.build({ data: Buffer.from('') })]);

				httpServiceMock.get.mockReturnValue(observable);

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return null', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await filesStorageClientAdapter.getStream(fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).not.toBeCalled();
			});
		});
	});

	describe('upload', () => {
		describe('when upload succeeds', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.SCHOOL;
				const parentId = faker.string.uuid();
				const parentType = FileRecordParentType.BOARDNODES;
				const file = new File([], faker.system.fileName());

				httpServiceMock.post.mockReturnValue(from([axiosResponseFactory.build({ data: { id: faker.string.uuid() } })]));

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
				};
			};

			it('should return the response data', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file } = setup();

				const result = await filesStorageClientAdapter.upload(
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file
				);

				expect(result).toEqual({ id: expect.any(String) });
			});
		});

		describe('when upload fails', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.SCHOOL;
				const parentId = faker.string.uuid();
				const parentType = FileRecordParentType.BOARDNODES;
				const file = new File([], faker.system.fileName());
				const observable = throwError(() => new Error('error'));

				httpServiceMock.post.mockReturnValue(observable);

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
				};
			};

			it('should return null', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file } = setup();

				const result = await filesStorageClientAdapter.upload(
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file
				);

				expect(result).toBeNull();
			});
		});
	});
});
