import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Readable } from 'node:stream';
import { of } from 'rxjs';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN } from '../legacy-file-archive.config';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';

const buildAxiosResponse = (data: unknown): AxiosResponse =>
	({ data, status: 200, statusText: 'OK', headers: {}, config: {} } as AxiosResponse);

describe('LegacyFileStorageAdapter', () => {
	let adapter: LegacyFileStorageAdapter;
	let httpService: DeepMocked<HttpService>;
	let module: TestingModule;

	const legacyBaseUrl = 'http://legacy-server';
	const jwt = 'test-jwt';
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
						_id: 'file-1',
						name: 'document.pdf',
						isDirectory: false,
						storageFileName: 'abc123.pdf',
						bucket: 'bucket-A',
						storageProviderId: 'sp-1',
					},
					{
						_id: 'file-2',
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
				expect(result[0].id).toBe('file-1');
				expect(result[0].name).toBe('document.pdf');
				expect(result[1].id).toBe('file-2');
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
				const directory = { _id: 'dir-1', name: 'my-folder', isDirectory: true };
				const childFile = { _id: 'file-3', name: 'child.txt', isDirectory: false };

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
				const dir1 = { _id: 'dir-1', name: 'folder1', isDirectory: true };
				const dir2 = { _id: 'dir-2', name: 'folder2', isDirectory: true };
				const file = { _id: 'file-deep', name: 'deep.txt', isDirectory: false };

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
				const rawFile = { _id: 'file-opt', name: 'bare.txt', isDirectory: false };
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
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse({ _id: 'file-1', name: 'file.txt' })));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow();
			});
		});

		describe('when a response item is missing required field _id', () => {
			it('should throw an error', async () => {
				const invalid = { name: 'no-id.txt', isDirectory: false };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});
		});

		describe('when a response item is missing required field name', () => {
			it('should throw an error', async () => {
				const invalid = { _id: 'file-x', isDirectory: false };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});
		});

		describe('when a response item has a non-boolean isDirectory', () => {
			it('should throw an error', async () => {
				const invalid = { _id: 'file-x', name: 'file.txt', isDirectory: 'yes' };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});
		});

		describe('when a response item has a non-string optional field', () => {
			it('should throw an error for a non-string bucket', async () => {
				const invalid = { _id: 'file-x', name: 'file.txt', isDirectory: false, bucket: 123 };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});

			it('should throw an error for a non-string parent', async () => {
				const invalid = { _id: 'file-x', name: 'file.txt', isDirectory: false, parent: 42 };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});

			it('should throw an error for a non-string storageFileName', async () => {
				const invalid = { _id: 'file-x', name: 'file.txt', isDirectory: false, storageFileName: true };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});

			it('should throw an error for a non-string storageProviderId', async () => {
				const invalid = { _id: 'file-x', name: 'file.txt', isDirectory: false, storageProviderId: {} };
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});
		});

		describe('when a second item is invalid', () => {
			it('should throw with the correct index', async () => {
				const valid = { _id: 'file-1', name: 'file.txt', isDirectory: false };
				const invalid = { _id: 'file-2', isDirectory: false };

				httpService.get.mockReturnValueOnce(of(buildAxiosResponse([valid, invalid])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 1 in legacy file storage response'
				);
			});
		});

		describe('when the response item is not an object', () => {
			it('should throw an error', async () => {
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse(['not-an-object'])));

				await expect(adapter.getFilesForOwner(ownerId)).rejects.toThrow(
					'Unexpected item shape at index 0 in legacy file storage response'
				);
			});
		});
	});

	describe('getSignedUrl', () => {
		describe('when the legacy service returns a signed URL', () => {
			const setup = () => {
				const fileId = 'file-abc';
				const fileName = 'document.pdf';
				const signedUrl = 'https://s3.example.com/bucket/file?X-Amz-Signature=abc123';

				httpService.get.mockReturnValueOnce(of(buildAxiosResponse({ url: signedUrl })));

				return { fileId, fileName, signedUrl };
			};

			it('should return the URL string', async () => {
				const { fileId, fileName, signedUrl } = setup();

				const result = await adapter.getSignedUrl(fileId, fileName);

				expect(result).toBe(signedUrl);
			});

			it('should call the signedUrl endpoint with correct params and JWT header', async () => {
				const { fileId, fileName } = setup();

				await adapter.getSignedUrl(fileId, fileName);

				expect(httpService.get).toHaveBeenCalledWith(`${legacyBaseUrl}/fileStorage/signedUrl`, {
					params: { file: fileId, download: true, name: fileName },
					headers: { authorization: `Bearer ${jwt}` },
				});
			});
		});

		describe('when the response does not contain a url string', () => {
			const setup = () => {
				const fileId = 'file-abc';
				const fileName = 'document.pdf';

				return { fileId, fileName };
			};

			it('should throw an error when url is not a string', async () => {
				const { fileId, fileName } = setup();
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse({ url: 123 })));

				await expect(adapter.getSignedUrl(fileId, fileName)).rejects.toThrow('Type is not a string');
			});

			it('should throw an error when response has no url field', async () => {
				const { fileId, fileName } = setup();
				httpService.get.mockReturnValueOnce(of(buildAxiosResponse({ other: 'data' })));

				await expect(adapter.getSignedUrl(fileId, fileName)).rejects.toThrow('Object has no url.');
			});
		});
	});

	describe('downloadFile', () => {
		describe('when signed URL is obtained and file downloads successfully', () => {
			const setup = () => {
				const fileId = 'file-abc';
				const fileName = 'document.pdf';
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
		});
	});
});
