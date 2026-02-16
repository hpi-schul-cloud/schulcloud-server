import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosError } from 'axios';
import { Readable } from 'node:stream';
import { from, throwError } from 'rxjs';
import util from 'util';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILE_STORAGE_CLIENT_CONFIG_TOKEN, FileStorageClientConfig } from './files-storage-client.config';
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
	let filesStorageClientAdapter: FilesStorageClientAdapter;
	let httpServiceMock: DeepMocked<HttpService>;
	let errorLoggerMock: DeepMocked<ErrorLogger>;
	let config: FileStorageClientConfig;
	let loggerMock: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
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
			],
		}).compile();

		loggerMock = module.get(Logger);
		httpServiceMock = module.get(HttpService);
		errorLoggerMock = module.get(ErrorLogger);
		httpServiceMock = module.get(HttpService);
		config = module.get(FILE_STORAGE_CLIENT_CONFIG_TOKEN);

		filesStorageClientAdapter = new FilesStorageClientAdapter(loggerMock, errorLoggerMock, httpServiceMock, config);
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
				const jwt = faker.internet.jwt();
				const fileRecordId = faker.string.uuid();
				const fileRecord = fileRecordResponseFactory.build();

				fileApiMock.getFileRecord.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecord }));

				return { jwt, fileRecordId, fileRecord };
			};

			it('should delegate to fileApi', async () => {
				const { jwt, fileRecordId, fileRecord } = setup();

				const result = await filesStorageClientAdapter.getFileRecord(jwt, fileRecordId);

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

				return {
					fileRecordId,
					fileName,
					jwt,
				};
			};

			it('should return the response stream', async () => {
				const { fileRecordId, fileName, jwt } = setup();

				const result = await filesStorageClientAdapter.getStream(jwt, fileRecordId, fileName);

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

				const result = await filesStorageClientAdapter.getStream(jwt, fileRecordId, fileName);

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

				const result = await filesStorageClientAdapter.getStream(jwt, fileRecordId, fileName);

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

				return {
					fileRecordId,
					fileName,
					jwt,
				};
			};

			it('should return null', async () => {
				const { fileRecordId, fileName, jwt } = setup();

				const result = await filesStorageClientAdapter.getStream(jwt, fileRecordId, fileName);

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

				const result = await filesStorageClientAdapter.upload(
					jwt,
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file
				);

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

				const result = await filesStorageClientAdapter.upload(
					jwt,
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file
				);

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

				const result = await filesStorageClientAdapter.upload(
					jwt,
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file
				);

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

				return {
					fileRecordId,
					jwt,
				};
			};

			it('should delegate to FileApi', async () => {
				const { fileRecordId, jwt } = setup();

				await expect(filesStorageClientAdapter.deleteFile(jwt, fileRecordId)).resolves.not.toThrow();
				expect(fileApiMock.deleteFile).toBeCalledWith(fileRecordId);
			});
		});
	});
});
