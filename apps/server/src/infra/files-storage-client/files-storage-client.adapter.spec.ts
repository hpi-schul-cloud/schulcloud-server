import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import type { Request } from 'express';
import { from, throwError } from 'rxjs';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FileApi, FileRecordParentType, StorageLocation } from './generated';

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

	describe('download', () => {
		describe('when download succeeds', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const observable = from([axiosResponseFactory.build({ data: Buffer.from('') })]);

				httpServiceMock.get.mockReturnValue(observable);
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return the response buffer', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await sut.download(fileRecordId, fileName);

				expect(result).toEqual(Buffer.from(''));
				expect(httpServiceMock.get).toBeCalledWith(expect.any(String), {
					responseType: 'arraybuffer',
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

				const result = await sut.download(fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalled();
			});
		});
	});

	describe('upload', () => {
		describe('when upload succeeds', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = faker.helpers.arrayElement(Object.values(StorageLocation.SCHOOL)) as StorageLocation;
				const parentId = 'parent-id';
				const parentType = faker.helpers.arrayElement(Object.values(FileRecordParentType));
				const file = new File([], 'test.txt', { type: 'text/plain', lastModified: Date.now() });
				const options = { headers: { Authorization: `Bearer ${faker.string.alphanumeric(42)}` } };

				const response = axiosResponseFactory.build({ data: { parentId } });

				httpServiceMock.post.mockReturnValue(from([response]));
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
					options,
				};
			};

			it('should return the response data', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, options } = setup();

				const result = await sut.upload(storageLocationId, storageLocation, parentId, parentType, file, options);

				expect(result).toBeDefined();
				expect(httpServiceMock.post).toBeCalledWith(expect.any(String), expect.any(FormData), {
					headers: {
						Authorization: expect.any(String),
					},
				});
				expect(result?.parentId).toEqual(parentId);
			});
		});

		describe('when upload fails', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = faker.helpers.arrayElement(Object.values(StorageLocation.SCHOOL)) as StorageLocation;
				const parentId = 'parent-id';
				const parentType = faker.helpers.arrayElement(Object.values(FileRecordParentType));
				const file = new File([], 'test.txt', { type: 'text/plain', lastModified: Date.now() });
				const options = { headers: { Authorization: `Bearer ${faker.string.alphanumeric(42)}` } };

				httpServiceMock.post.mockReturnValue(throwError(() => new Error('error')));
				configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());

				return {
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					file,
					options,
				};
			};

			it('should return null', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, file, options } = setup();

				const result = await sut.upload(storageLocationId, storageLocation, parentId, parentType, file, options);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalled();
			});
		});
	});
});
