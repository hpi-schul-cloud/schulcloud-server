import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import type { Request } from 'express';
import { Readable } from 'node:stream';
import { from, throwError } from 'rxjs';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FileApi, FileRecordParentType, StorageLocation } from './generated';

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

		describe('when download fails', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = throwError(() => new Error('error'));
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

				const result = await sut.getStream(jwt, fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalled();
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

		describe('when upload fails', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.SCHOOL;
				const parentId = faker.string.uuid();
				const parentType = FileRecordParentType.BOARDNODES;
				const file = new File([], faker.system.fileName());
				const observable = throwError(() => new Error('error'));
				const jwt = faker.internet.jwt();

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

			it('should return null', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, jwt } = setup();

				const result = await sut.upload(jwt, storageLocationId, storageLocation, parentId, parentType, file);

				expect(result).toBeNull();
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
