import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosError } from 'axios';
import type { Request } from 'express';
import { Readable } from 'node:stream';
import { from, throwError } from 'rxjs';
import util from 'util';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FileApi, FileRecordParentType, StorageLocation } from './generated';
import { GenericFileStorageLoggable } from './loggables';
import { fileRecordResponseFactory } from './testing';

const fileApiMock = createMock<FileApi>();
jest.mock('./generated/api/file-api', () => {
	return {
		FileApi: jest.fn().mockImplementation(() => fileApiMock),
	};
});

describe(FilesStorageClientAdapter.name, () => {
	let module: TestingModule;
	let sut: FilesStorageClientAdapter;
	let httpServiceMock: DeepMocked<HttpService>;
	let errorLoggerMock: DeepMocked<ErrorLogger>;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageClientAdapter,
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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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

		sut = module.get(FilesStorageClientAdapter);
		httpServiceMock = module.get(HttpService);
		errorLoggerMock = module.get(ErrorLogger);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('getFileRecord', () => {
		describe('when fetching file records', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const fileRecordId = faker.string.uuid();
				const fileRecord = fileRecordResponseFactory.build();

				configServiceMock.getOrThrow.mockReturnValueOnce(faker.internet.url());
				fileApiMock.getFileRecord.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecord }));

				return { jwt, fileRecordId, fileRecord };
			};

			it('should delegate to fileApi', async () => {
				const { jwt, fileRecordId, fileRecord } = setup();

				const result = await sut.getFileRecord(jwt, fileRecordId);

				expect(fileApiMock.getFileRecord).toHaveBeenCalledWith(fileRecordId);
				expect(result).toStrictEqual(fileRecord);
			});
		});
	});

	describe('getStream', () => {
		describe('when download succeeds', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = from([axiosResponseFactory.build({ data: Readable.from('') })]);
				const jwt = faker.internet.jwt();

				httpServiceMock.get.mockReturnValue(observable);
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					fileRecordId,
					fileName,
					jwt,
				};
			};

			it('should return the response stream', async () => {
				const { fileRecordId, fileName, jwt } = setup();

				const result = await sut.getStream(jwt, fileRecordId, fileName);

				expect(result).toBeDefined();
				expect(httpServiceMock.get).toBeCalledWith(expect.any(String), {
					responseType: 'stream',
					headers: {
						Authorization: expect.any(String),
					},
				});
			});
		});

		describe('when download fails with AxiosError', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const jwt = faker.internet.jwt();
				const observable = throwError(() => new AxiosError());

				httpServiceMock.get.mockReturnValue(observable);

				return {
					fileRecordId,
					fileName,
					jwt,
				};
			};

			it('should return null and log AxiosErrorLoggable', async () => {
				const { fileRecordId, fileName, jwt } = setup();

				const result = await sut.getStream(jwt, fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalledWith(
					new AxiosErrorLoggable(expect.any(AxiosError), 'FilesStorageClientAdapter.getStream')
				);
			});
		});

		describe('when download fails with unknown Error', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const error = new Error('error');
				const jwt = faker.internet.jwt();
				const observable = throwError(() => error);

				httpServiceMock.get.mockReturnValue(observable);

				return {
					fileRecordId,
					fileName,
					error,
					jwt,
				};
			};

			it('should return null and log GenericFileStorageLoggable', async () => {
				const { fileRecordId, fileName, error, jwt } = setup();

				const result = await sut.getStream(jwt, fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalledWith(
					new GenericFileStorageLoggable(`An unknown error occurred in FilesStorageClientAdapter.getStream`, {
						error: util.inspect(error),
					})
				);
			});
		});

		describe('when download does not return a stream', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = from([axiosResponseFactory.build({ data: Buffer.from('') })]);
				const jwt = faker.internet.jwt();

				httpServiceMock.get.mockReturnValue(observable);
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					fileRecordId,
					fileName,
					jwt,
				};
			};

			it('should return null', async () => {
				const { fileRecordId, fileName, jwt } = setup();

				const result = await sut.getStream(jwt, fileRecordId, fileName);

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
				const jwt = faker.internet.jwt();

				httpServiceMock.post.mockReturnValue(from([axiosResponseFactory.build({ data: { id: faker.string.uuid() } })]));
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
					jwt,
				};
			};

			it('should return the response data', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, jwt } = setup();

				const result = await sut.upload(jwt, storageLocationId, storageLocation, parentId, parentType, file);

				expect(result).toEqual({ id: expect.any(String) });
			});
		});

		describe('when upload fails with AxiosError', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.SCHOOL;
				const parentId = faker.string.uuid();
				const parentType = FileRecordParentType.BOARDNODES;
				const file = new File([], faker.system.fileName());
				const jwt = faker.internet.jwt();
				const observable = throwError(() => new AxiosError());

				httpServiceMock.post.mockReturnValue(observable);

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
					jwt,
				};
			};

			it('should return null and log AxiosErrorLoggable', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, jwt } = setup();

				const result = await sut.upload(jwt, storageLocationId, storageLocation, parentId, parentType, file);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalledWith(
					new AxiosErrorLoggable(expect.any(AxiosError), 'FilesStorageClientAdapter.upload')
				);
			});
		});

		describe('when upload fails with unknown Error', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.SCHOOL;
				const parentId = faker.string.uuid();
				const parentType = FileRecordParentType.BOARDNODES;
				const file = new File([], faker.system.fileName());
				const error = new Error('error');
				const observable = throwError(() => error);
				const jwt = faker.internet.jwt();

				httpServiceMock.post.mockReturnValue(observable);

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
					error,
					jwt,
				};
			};

			it('should return null and log GenericFileStorageLoggable', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, error, jwt } = setup();

				const result = await sut.upload(jwt, storageLocationId, storageLocation, parentId, parentType, file);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalledWith(
					new GenericFileStorageLoggable(`An unknown error occurred in FilesStorageClientAdapter.upload`, {
						error: util.inspect(error),
					})
				);
			});
		});
	});

	describe('deleteFile', () => {
		describe('when deleting a file', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const jwt = faker.internet.jwt();

				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					fileRecordId,
					jwt,
				};
			};

			it('should delegate to FileApi', async () => {
				const { fileRecordId, jwt } = setup();

				await expect(sut.deleteFile(jwt, fileRecordId)).resolves.not.toThrow();
				expect(fileApiMock.deleteFile).toBeCalledWith(fileRecordId);
			});
		});
	});
});
