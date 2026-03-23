import { faker } from '@faker-js/faker/.';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import { Readable } from 'node:stream';
import { of, throwError } from 'rxjs';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN } from '../legacy-file-archive.config';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';

const buildAxiosResponse = (data: unknown): AxiosResponse =>
	({ data, status: 200, statusText: 'OK', headers: {}, config: {} } as AxiosResponse);

describe('LegacyFileStorageAdapter', () => {
	let adapter: LegacyFileStorageAdapter;
	let httpService: DeepMocked<HttpService>;
	let module: TestingModule;

	const legacyBaseUrl = 'http://legacy-server';
	const jwt = faker.internet.jwt();
	const ownerId = 'owner-123';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LegacyFileStorageAdapter,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: LEGACY_FILE_ARCHIVE_CONFIG_TOKEN,
					useValue: { legacyBaseUrl },
				},
				{
					provide: REQUEST,
					useValue: { headers: { authorization: `Bearer ${jwt}` } },
				},
			],
		}).compile();

		adapter = module.get(LegacyFileStorageAdapter);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('getFilesForOwner', () => {
		describe('when the response contains flat files (no directories)', () => {
			const setup = () => {
				const rawFiles = [
					{
						_id: new ObjectId().toHexString(),
						name: 'document.pdf',
						isDirectory: false,
						storageFileName: 'abc123.pdf',
						bucket: 'bucket-A',
						storageProviderId: new ObjectId().toHexString(),
					},
					{
						_id: new ObjectId().toHexString(),
						name: 'image.png',
						isDirectory: false,
						parent: undefined,
					},
				];

				httpService.get.mockReturnValueOnce(of(buildAxiosResponse(rawFiles)));

				return { rawFiles };
			};

			it('should return a FileDo for each file', async () => {
				const { rawFiles } = setup();

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result).toHaveLength(rawFiles.length);
				expect(result[0].id).toBe(rawFiles[0]._id);
				expect(result[0].name).toBe('document.pdf');
				expect(result[1].id).toBe(rawFiles[1]._id);
				expect(result[1].name).toBe('image.png');
			});

			it('should call the correct URL with owner param and JWT header', async () => {
				setup();

				await adapter.getFilesForOwner(ownerId);

				expect(httpService.get).toHaveBeenCalledWith(`${legacyBaseUrl}/fileStorage`, {
					params: { owner: ownerId },
					headers: { authorization: `Bearer ${jwt}` },
				});
			});
		});

		describe('when the response contains flat files with a blocked file', () => {
			const setup = () => {
				const rawFiles = [
					{
						_id: new ObjectId().toHexString(),
						name: 'document.pdf',
						isDirectory: false,
						storageFileName: 'abc123.pdf',
						bucket: 'bucket-A',
						storageProviderId: new ObjectId().toHexString(),
						securityCheck: { status: 'passed' },
					},
					{
						_id: new ObjectId().toHexString(),
						name: 'virus.txt',
						isDirectory: false,
						storageFileName: 'virus.txt',
						bucket: 'bucket-A',
						storageProviderId: new ObjectId().toHexString(),
						securityCheck: { status: 'blocked' },
					},
					{
						_id: new ObjectId().toHexString(),
						name: 'image.png',
						isDirectory: false,
						parent: undefined,
					},
				];

				httpService.get.mockReturnValueOnce(of(buildAxiosResponse(rawFiles)));

				return { rawFiles };
			};

			it('should return a FileDo for each file', async () => {
				const { rawFiles } = setup();

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result).toHaveLength(2);
				expect(result[0].id).toBe(rawFiles[0]._id);
				expect(result[0].name).toBe('document.pdf');
				expect(result[1].id).toBe(rawFiles[2]._id);
				expect(result[1].name).toBe('image.png');
			});

			it('should call the correct URL with owner param and JWT header', async () => {
				setup();

				await adapter.getFilesForOwner(ownerId);

				expect(httpService.get).toHaveBeenCalledWith(`${legacyBaseUrl}/fileStorage`, {
					params: { owner: ownerId },
					headers: { authorization: `Bearer ${jwt}` },
				});
			});
		});

		describe('when the response contains a directory', () => {
			const setup = () => {
				const directory = { _id: new ObjectId().toHexString(), name: 'my-folder', isDirectory: true };
				const childFile = { _id: new ObjectId().toHexString(), name: 'child.txt', isDirectory: false };

				httpService.get
					.mockReturnValueOnce(of(buildAxiosResponse([directory])))
					.mockReturnValueOnce(of(buildAxiosResponse([childFile])));

				return { directory, childFile };
			};

			it('should recursively fetch children of directories', async () => {
				const { childFile } = setup();

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result).toHaveLength(2);
				expect(result.find((f) => f.id === childFile._id)).toBeDefined();
			});

			it('should pass the directory _id as parent param in the recursive call', async () => {
				const { directory } = setup();

				await adapter.getFilesForOwner(ownerId);

				expect(httpService.get).toHaveBeenCalledWith(`${legacyBaseUrl}/fileStorage`, {
					params: { owner: ownerId, parent: directory._id },
					headers: { authorization: `Bearer ${jwt}` },
				});
			});
		});

		describe('when the response contains nested directories', () => {
			const setup = () => {
				const dir1 = { _id: new ObjectId().toHexString(), name: 'folder1', isDirectory: true };
				const dir2 = { _id: new ObjectId().toHexString(), name: 'folder2', isDirectory: true };
				const file = { _id: new ObjectId().toHexString(), name: 'deep.txt', isDirectory: false };

				httpService.get
					.mockReturnValueOnce(of(buildAxiosResponse([dir1])))
					.mockReturnValueOnce(of(buildAxiosResponse([dir2])))
					.mockReturnValueOnce(of(buildAxiosResponse([file])));

				return { dir1, dir2, file };
			};

			it('should return all files from all nesting levels', async () => {
				const { dir1, dir2, file } = setup();

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result).toHaveLength(3);
				expect(result.map((f) => f.id)).toEqual(expect.arrayContaining([dir1._id, dir2._id, file._id]));
			});
		});

		describe('when the response is an empty array', () => {
			it('should return an empty array', async () => {
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([])));

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result).toEqual([]);
			});
		});

		describe('when optional fields are undefined', () => {
			it('should map the file with undefined optional fields', async () => {
				const rawFile = { _id: new ObjectId().toHexString(), name: 'bare.txt', isDirectory: false };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([rawFile])));

				const result = await adapter.getFilesForOwner(ownerId);

				expect(result[0].parentId).toBeUndefined();
				expect(result[0].storageFileName).toBeUndefined();
				expect(result[0].bucket).toBeUndefined();
				expect(result[0].storageProviderId).toBeUndefined();
			});
		});

		describe('when the response is not an array', () => {
			it('should throw an error', async () => {
				httpService.get.mockReturnValueOnce(
					of(buildAxiosResponse({ _id: new ObjectId().toHexString(), name: 'file.txt' }))
				);

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow();
			});
		});

		describe('when a response item is missing required field _id', () => {
			it('should throw an error', async () => {
				const invalid = { name: 'no-id.txt', isDirectory: false };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property _id has failed the following constraints: isMongoId/s
				);
			});
		});

		describe('when a response item is missing required field name', () => {
			it('should throw an error', async () => {
				const invalid = { _id: new ObjectId().toHexString(), isDirectory: false };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property name has failed the following constraints: isString/s
				);
			});
		});

		describe('when a response item has a non-boolean isDirectory', () => {
			it('should throw an error', async () => {
				const invalid = { _id: new ObjectId().toHexString(), name: 'file.txt', isDirectory: 'yes' };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property isDirectory has failed the following constraints: isBoolean/s
				);
			});
		});

		describe('when a response item has a non-string optional field', () => {
			it('should throw an error for a non-string bucket', async () => {
				const invalid = { _id: new ObjectId().toHexString(), name: 'file.txt', isDirectory: false, bucket: 123 };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property bucket has failed the following constraints: isString/s
				);
			});

			it('should throw an error for a non-mongoId parent', async () => {
				const invalid = { _id: new ObjectId().toHexString(), name: 'file.txt', isDirectory: false, parent: 42 };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property parent has failed the following constraints: isMongoId/s
				);
			});

			it('should throw an error for a non-string storageFileName', async () => {
				const invalid = {
					_id: new ObjectId().toHexString(),
					name: 'file.txt',
					isDirectory: false,
					storageFileName: true,
				};
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property storageFileName has failed the following constraints: isString/s
				);
			});

			it('should throw an error for a non-mongoId storageProviderId', async () => {
				const invalid = {
					_id: new ObjectId().toHexString(),
					name: 'file.txt',
					isDirectory: false,
					storageProviderId: {},
				};
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property storageProviderId has failed the following constraints: isMongoId/s
				);
			});
		});

		describe('when a second item is invalid', () => {
			it('should throw with the correct index', async () => {
				const valid = { _id: new ObjectId().toHexString(), name: 'file.txt', isDirectory: false };
				const invalid = { _id: new ObjectId().toHexString(), isDirectory: false };

				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([valid, invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property name has failed the following constraints: isString/s
				);
			});
		});

		describe('when the response item is not an object', () => {
			it('should throw an error', async () => {
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse(['not-an-object'])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					/has failed the validation:.*property name has failed the following constraints: isString/s
				);
			});
		});

		describe('getFiles throws an error', () => {
			it('should throw an InternalServerErrorException', async () => {
				const error = new Error('Network error');
				httpService.get.mockReturnValueOnce(throwError(() => error));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('downloadFile', () => {
		describe('when signed URL is obtained and file downloads successfully', () => {
			const setup = () => {
				const fileId = new ObjectId().toHexString();
				const fileName = '/../../document.pdf';
				const signedUrl = 'https://s3.example.com/bucket/file?X-Amz-Signature=abc123';
				const mockStream = new Readable({ read() {} });

				httpService.get
					.mockReturnValueOnce(of(buildAxiosResponse({ url: signedUrl })))
					.mockReturnValueOnce(of(buildAxiosResponse(mockStream)));

				return { fileId, fileName, signedUrl, mockStream };
			};

			it('should return a readable stream', async () => {
				const { fileId, fileName, mockStream } = setup();

				const result = await adapter.downloadFile(fileId, fileName);

				expect(result).toBe(mockStream);
			});

			it('should fetch the signed URL without auth headers', async () => {
				const { fileId, fileName, signedUrl } = setup();

				await adapter.downloadFile(fileId, fileName);

				expect(httpService.get).toHaveBeenCalledWith(signedUrl, { responseType: 'stream' });
			});

			it('should fetch the signed URL with correct params', async () => {
				const { fileId, fileName } = setup();

				await adapter.downloadFile(fileId, fileName);
				expect(httpService.get).toHaveBeenCalledWith(`${legacyBaseUrl}/fileStorage/signedUrl`, {
					params: { file: fileId, download: true, name: encodeURI(encodeURIComponent(fileName)) },
					headers: { authorization: `Bearer ${jwt}` },
				});
			});
		});

		describe('getSignedUrl throws an error', () => {
			it('should throw an InternalServerErrorException', async () => {
				const error = new Error('Network error');
				httpService.get.mockReturnValueOnce(throwError(() => error));

				await expect(adapter.downloadFile('file123', 'document.pdf')).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('when downloadFile throws an error', () => {
			it('should throw an InternalServerErrorException', async () => {
				const error = new Error('Network error');
				httpService.get
					.mockReturnValueOnce(of(buildAxiosResponse({ url: 'signedUrl' })))
					.mockReturnValueOnce(throwError(() => error));

				await expect(adapter.downloadFile('file123', 'document.pdf')).rejects.toThrow(InternalServerErrorException);
			});
		});
	});
});
