import { ErrorLogger, Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { ObjectId } from 'bson';
import type { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILE_STORAGE_CLIENT_CONFIG_TOKEN } from './files-storage-client.config';
import { FileApi, FileRecordParentType, StorageLocation } from './generated';
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
				const fileRecordId = new ObjectId().toHexString();
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

		describe('when fileApi throws an error', () => {
			const setup = (error: unknown) => {
				const fileRecordId = new ObjectId().toHexString();
				fileApiMock.getFileRecord.mockRejectedValueOnce(error);
				return { fileRecordId };
			};

			it('should throw an axios error', async () => {
				const error = axiosErrorFactory.build();
				const { fileRecordId } = setup(error);

				await expect(filesStorageClientAdapter.getFileRecord(fileRecordId)).rejects.toThrow(
					'An unknown error occurred in FilesStorageClientAdapter.getFileRecord'
				);
			});

			it('should throw a generic error', async () => {
				const error = new Error('File API error');
				const { fileRecordId } = setup(error);

				await expect(filesStorageClientAdapter.getFileRecord(fileRecordId)).rejects.toThrow(
					'An unknown error occurred in FilesStorageClientAdapter.getFileRecord'
				);
			});
		});
	});

	describe('uploadFromUrl', () => {
		describe('when uploading file from url', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.INSTANCE;
				const parentId = new ObjectId().toHexString();
				const parentType = FileRecordParentType.EXTERNALTOOLS;
				const fileUrlParams = {
					url: faker.internet.url(),
					fileName: faker.system.fileName(),
				};
				const fileRecord = fileRecordResponseFactory.build();

				fileApiMock.uploadFromUrl.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecord }));

				return { storageLocationId, storageLocation, parentId, parentType, fileUrlParams, fileRecord };
			};

			it('should delegate to fileApi', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, fileUrlParams, fileRecord } = setup();

				const result = await filesStorageClientAdapter.uploadFromUrl(
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					fileUrlParams
				);

				expect(fileApiMock.uploadFromUrl).toHaveBeenCalledWith(
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					fileUrlParams,
					{
						headers: {
							authorization: expect.stringMatching(/^Bearer\s.+$/),
						},
					}
				);
				expect(result).toStrictEqual(fileRecord);
			});

			describe('when fileApi throws an error', () => {
				const setup = (error: unknown) => {
					const storageLocationId = faker.string.uuid();
					const storageLocation = StorageLocation.INSTANCE;
					const parentId = new ObjectId().toHexString();
					const parentType = FileRecordParentType.EXTERNALTOOLS;
					const fileUrlParams = {
						url: faker.internet.url(),
						fileName: faker.system.fileName(),
					};

					fileApiMock.uploadFromUrl.mockRejectedValueOnce(error);

					return { storageLocationId, storageLocation, parentId, parentType, fileUrlParams };
				};

				it('should throw an axios error', async () => {
					const error = axiosErrorFactory.build();
					const { storageLocationId, storageLocation, parentId, parentType, fileUrlParams } = setup(error);

					await expect(
						filesStorageClientAdapter.uploadFromUrl(
							storageLocationId,
							storageLocation,
							parentId,
							parentType,
							fileUrlParams
						)
					).rejects.toThrow('An unknown error occurred in FilesStorageClientAdapter.uploadFromUrl');
				});

				it('should throw a generic error', async () => {
					const error = new Error('File API error');
					const { storageLocationId, storageLocation, parentId, parentType, fileUrlParams } = setup(error);

					await expect(
						filesStorageClientAdapter.uploadFromUrl(
							storageLocationId,
							storageLocation,
							parentId,
							parentType,
							fileUrlParams
						)
					).rejects.toThrow('An unknown error occurred in FilesStorageClientAdapter.uploadFromUrl');
				});
			});
		});
	});

	describe('deleteByParent', () => {
		describe('when deleting files by parent', () => {
			const setup = () => {
				const storageLocationId = faker.string.uuid();
				const storageLocation = StorageLocation.INSTANCE;
				const parentId = new ObjectId().toHexString();
				const parentType = FileRecordParentType.EXTERNALTOOLS;
				const fileRecordList = {
					data: [fileRecordResponseFactory.build(), fileRecordResponseFactory.build()],
					total: 2,
					skip: 0,
					limit: 10,
				};

				fileApiMock.deleteByParent.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecordList }));

				return { storageLocationId, storageLocation, parentId, parentType, fileRecordList };
			};

			it('should delegate to fileApi', async () => {
				const { storageLocationId, storageLocation, parentId, parentType, fileRecordList } = setup();

				const result = await filesStorageClientAdapter.deleteByParent(
					storageLocationId,
					storageLocation,
					parentId,
					parentType
				);

				expect(fileApiMock.deleteByParent).toHaveBeenCalledWith(
					storageLocationId,
					storageLocation,
					parentId,
					parentType,
					{
						headers: {
							authorization: expect.stringMatching(/^Bearer\s.+$/),
						},
					}
				);
				expect(result).toStrictEqual(fileRecordList);
			});

			describe('when fileApi throws an error', () => {
				const setup = (error: unknown) => {
					const storageLocationId = faker.string.uuid();
					const storageLocation = StorageLocation.INSTANCE;
					const parentId = new ObjectId().toHexString();
					const parentType = FileRecordParentType.EXTERNALTOOLS;

					fileApiMock.deleteByParent.mockRejectedValueOnce(error);

					return { storageLocationId, storageLocation, parentId, parentType };
				};

				it('should throw an axios error', async () => {
					const error = axiosErrorFactory.build();
					const { storageLocationId, storageLocation, parentId, parentType } = setup(error);

					await expect(
						filesStorageClientAdapter.deleteByParent(storageLocationId, storageLocation, parentId, parentType)
					).rejects.toThrow('An unknown error occurred in FilesStorageClientAdapter.deleteByParent');
				});

				it('should throw a generic error', async () => {
					const error = new Error('File API error');
					const { storageLocationId, storageLocation, parentId, parentType } = setup(error);

					await expect(
						filesStorageClientAdapter.deleteByParent(storageLocationId, storageLocation, parentId, parentType)
					).rejects.toThrow('An unknown error occurred in FilesStorageClientAdapter.deleteByParent');
				});
			});
		});
	});

	describe('deleteFile', () => {
		describe('when deleting a file', () => {
			const setup = () => {
				const fileRecordId = new ObjectId().toHexString();
				const fileRecord = fileRecordResponseFactory.build();

				fileApiMock.deleteFile.mockResolvedValueOnce(axiosResponseFactory.build({ data: fileRecord }));

				return { fileRecordId, fileRecord };
			};

			it('should delegate to fileApi', async () => {
				const { fileRecordId, fileRecord } = setup();

				const result = await filesStorageClientAdapter.deleteFile(fileRecordId);

				expect(fileApiMock.deleteFile).toHaveBeenCalledWith(fileRecordId, {
					headers: {
						authorization: expect.stringMatching(/^Bearer\s.+$/),
					},
				});
				expect(result).toStrictEqual(fileRecord);
			});

			describe('when fileApi throws an error', () => {
				const setup = (error: unknown) => {
					const fileRecordId = new ObjectId().toHexString();

					fileApiMock.deleteFile.mockRejectedValueOnce(error);

					return { fileRecordId };
				};

				it('should throw an axios error', async () => {
					const error = axiosErrorFactory.build();
					const { fileRecordId } = setup(error);

					await expect(filesStorageClientAdapter.deleteFile(fileRecordId)).rejects.toThrow(
						'An unknown error occurred in FilesStorageClientAdapter.deleteFile'
					);
				});

				it('should throw a generic error', async () => {
					const error = new Error('File API error');
					const { fileRecordId } = setup(error);

					await expect(filesStorageClientAdapter.deleteFile(fileRecordId)).rejects.toThrow(
						'An unknown error occurred in FilesStorageClientAdapter.deleteFile'
					);
				});
			});
		});
	});
});
