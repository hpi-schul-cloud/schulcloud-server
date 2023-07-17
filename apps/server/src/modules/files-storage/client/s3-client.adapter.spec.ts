import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'node:stream';
import { FileDto } from '../dto';
import { S3Config } from '../interface/config';
import { S3ClientAdapter } from './s3-client.adapter';

const createParameter = () => {
	const config = {
		endpoint: '',
		region: '',
		bucket: 'test-bucket',
		accessKeyId: '',
		secretAccessKey: '',
	};
	const pathToFile = 'test/text.txt';
	const bytesRange = 'bytes=0-1';

	return { config, pathToFile, bytesRange };
};

describe('S3ClientAdapter', () => {
	let module: TestingModule;
	let service: S3ClientAdapter;
	let client: DeepMocked<S3Client>;

	beforeAll(async () => {
		const { config } = createParameter();

		module = await Test.createTestingModule({
			providers: [
				S3ClientAdapter,
				{
					provide: 'S3_Client',
					useValue: createMock<S3Client>(),
				},
				{
					provide: 'S3_Config',
					useValue: createMock<S3Config>(config),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(S3ClientAdapter);
		client = module.get('S3_Client');
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createBucket', () => {
		describe('WHEN bucket is created successfully', () => {
			const setup = () => {
				const { config } = createParameter();

				return { config };
			};

			it('should call send() of client', async () => {
				const { config } = setup();

				await service.createBucket();

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket },
					})
				);
			});
		});

		describe('WHEN client throws error', () => {
			const setup = () => {
				const error = new Error('Bad Request');
				// @ts-expect-error Testcase
				client.send.mockRejectedValueOnce(error);
			};

			it('should throw error from client', async () => {
				setup();

				await expect(service.createBucket()).rejects.toThrow();
			});
		});
	});

	describe('getFile', () => {
		describe('WHEN file was received successfully ', () => {
			const setup = () => {
				const { pathToFile, config, bytesRange } = createParameter();
				const resultObj = {
					Body: { on: () => true },
					ContentType: 'data.ContentType',
					ContentLength: 'data.ContentLength',
					ContentRange: 'data.ContentRange',
					ETag: 'data.ETag',
				};

				// @ts-expect-error Testcase
				client.send.mockResolvedValueOnce(resultObj);

				return { pathToFile, config, bytesRange };
			};

			it('should call send() of client', async () => {
				const { pathToFile, config } = setup();

				await service.get(pathToFile);

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket, Key: pathToFile },
					})
				);
			});

			it('should call send() of client with bytes range', async () => {
				const { pathToFile, config, bytesRange } = setup();

				await service.get(pathToFile, bytesRange);

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket, Key: pathToFile, Range: bytesRange },
					})
				);
			});

			it('should return file', async () => {
				const { pathToFile } = setup();

				setup();

				const result = await service.get(pathToFile);

				expect(result).toStrictEqual(
					expect.objectContaining({
						contentType: 'data.ContentType',
						contentLength: 'data.ContentLength',
						contentRange: 'data.ContentRange',
						etag: 'data.ETag',
					})
				);
			});
		});

		describe('WHEN client throws error', () => {
			const setup = (errorKey: string) => {
				const { pathToFile } = createParameter();
				const error = new Error(errorKey);
				// @ts-expect-error Testcase
				client.send.mockRejectedValueOnce(error);

				return { error, pathToFile };
			};

			it('should throw NotFoundException', async () => {
				const { pathToFile } = setup('NoSuchKey');

				await expect(service.get(pathToFile)).rejects.toThrowError(NotFoundException);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup('Unknown Error');

				await expect(service.get(pathToFile)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('create', () => {
		const createFile = () => {
			const readable = Readable.from('ddd');
			const file = new FileDto({
				data: readable,
				name: 'test.txt',
				mimeType: 'text/plain',
			});

			return { file };
		};

		describe('WHEN file is created successfully', () => {
			const setup = () => {
				const { file } = createFile();
				const { pathToFile } = createParameter();

				// @ts-expect-error EndpointMock
				client.config.endpoint = () => {
					return { protocol: '' };
				};

				const restoreMocks = () => {
					// @ts-expect-error Set of undefined works as mock restore
					client.config.endpoint = undefined;
				};

				return { file, pathToFile, restoreMocks };
			};

			it('should return data', async () => {
				const { file, pathToFile, restoreMocks } = setup();

				const result = await service.create(pathToFile, file);

				expect(result).toBeDefined();

				restoreMocks();
			});
		});

		describe('WHEN client throws NoSuchBucket error', () => {
			const setup = () => {
				const { file } = createFile();
				const { pathToFile } = createParameter();
				const error = { Code: 'NoSuchBucket' };

				const uploadDoneMock = jest.spyOn(Upload.prototype, 'done').mockRejectedValueOnce(error);
				const createBucketMock = jest.spyOn(service, 'createBucket').mockResolvedValueOnce();
				const createSpy = jest.spyOn(service, 'create');
				// @ts-expect-error EndpointMock
				client.config.endpoint = () => {
					return { protocol: '' };
				};

				const restoreMocks = () => {
					uploadDoneMock.mockRestore();
					createBucketMock.mockRestore();
					createSpy.mockRestore();
					// @ts-expect-error Set of undefined works as mock restore
					client.config.endpoint = undefined;
				};

				return { file, pathToFile, error, createSpy, restoreMocks };
			};

			it('should call createBucket() and itself', async () => {
				const { file, pathToFile, createSpy, restoreMocks } = setup();

				await service.create(pathToFile, file);

				expect(service.createBucket).toBeCalled();
				expect(createSpy).toBeCalledTimes(2);

				restoreMocks();
			});
		});

		describe('WHEN client throws error', () => {
			const setup = () => {
				const { file } = createFile();
				const { pathToFile } = createParameter();
				const error = new InternalServerErrorException('testError', 'S3ClientAdapter:create');

				const uploadDoneMock = jest.spyOn(Upload.prototype, 'done').mockRejectedValueOnce(error);

				const restoreMocks = () => {
					uploadDoneMock.mockRestore();
				};

				return { file, pathToFile, error, restoreMocks };
			};

			it('should throw error from client', async () => {
				const { file, pathToFile, error, restoreMocks } = setup();

				await expect(service.create(pathToFile, file)).rejects.toThrow(error);

				restoreMocks();
			});
		});
	});

	describe('moveToTrash', () => {
		const setup = () => {
			const { pathToFile } = createParameter();

			return { pathToFile };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathToFile } = setup();

			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', CopySource: 'test-bucket/test/text.txt', Key: 'trash/test/text.txt' },
				})
			);
		});

		it('should call send() of client with delete objects', async () => {
			const { pathToFile } = setup();

			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});

		it('should return empty array on error with Code "NoSuchKey"', async () => {
			const { pathToFile } = setup();

			// @ts-expect-error should run into error
			client.send.mockRejectedValue({ Code: 'NoSuchKey' });

			const res = await service.moveToTrash([pathToFile]);

			expect(res).toEqual([]);
		});

		it('should throw an InternalServerErrorException on error', async () => {
			// @ts-expect-error should run into error
			await expect(service.moveToTrash(undefined)).rejects.toThrowError(InternalServerErrorException);
		});
	});

	describe('delete', () => {
		const setup = () => {
			const { pathToFile } = createParameter();

			return { pathToFile };
		};

		it('should call send() of client with delete objects', async () => {
			const { pathToFile } = setup();

			await service.delete([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});
	});

	describe('restore', () => {
		const setup = () => {
			const { pathToFile } = createParameter();

			return { pathToFile };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathToFile } = setup();

			await service.restore([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						CopySource: 'test-bucket/trash/test/text.txt',
						Key: 'test/text.txt',
					},
				})
			);
		});

		it('should call send() of client with delete objects', async () => {
			const { pathToFile } = setup();

			await service.restore([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', Delete: { Objects: [{ Key: 'trash/test/text.txt' }] } },
				})
			);
		});

		it('should throw an InternalServerErrorException by error', async () => {
			// @ts-expect-error should run into error
			await expect(service.restore(undefined)).rejects.toThrowError(InternalServerErrorException);
		});
	});

	describe('copy', () => {
		const setup = () => {
			const pathsToCopy = [
				{
					sourcePath: 'trash/test/text.txt',
					targetPath: 'test/text.txt',
				},
			];

			return { pathsToCopy };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathsToCopy } = setup();

			await service.copy(pathsToCopy);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						CopySource: 'test-bucket/trash/test/text.txt',
						Key: 'test/text.txt',
					},
				})
			);
		});

		it('should throw an InternalServerErrorException by error', async () => {
			// @ts-expect-error should run into error
			await expect(service.copy(undefined)).rejects.toThrowError(InternalServerErrorException);
		});
	});

	describe('head', () => {
		const setup = () => {
			const { pathToFile } = createParameter();

			return { pathToFile };
		};

		describe('when file exists', () => {
			it('should call send() of client with head object', async () => {
				const { pathToFile } = setup();

				await service.head(pathToFile);

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: 'test-bucket', Key: pathToFile },
					})
				);
			});
		});

		describe('when file does not exist', () => {
			it('should throw NotFoundException', async () => {
				const { pathToFile } = setup();
				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValueOnce(new Error('NoSuchKey'));

				const headPromise = service.head(pathToFile);

				await expect(headPromise).rejects.toBeInstanceOf(NotFoundException);
			});
		});
	});

	describe('list', () => {
		const setup = () => {
			const prefix = 'test/';

			const keys = Array.from(Array(2500).keys()).map((n) => `KEY-${n}`);
			const responseContents = keys.map((key) => {
				return {
					Key: `${prefix}${key}`,
				};
			});

			return { prefix, keys, responseContents };
		};

		afterEach(() => {
			client.send.mockClear();
		});

		it('should truncate result when max is given', async () => {
			const { prefix, keys, responseContents } = setup();

			// @ts-expect-error ignore parameter type of mock function
			client.send.mockResolvedValue({
				IsTruncated: false,
				Contents: responseContents.slice(0, 500),
			});

			const resultKeys = await service.list(prefix, 500);

			expect(resultKeys).toEqual(keys.slice(0, 500));

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						Prefix: prefix,
						ContinuationToken: undefined,
						MaxKeys: 500,
					},
				})
			);
		});

		it('should call send() multiple times if bucket contains more than 1000 keys', async () => {
			const { prefix, responseContents, keys } = setup();

			client.send
				// @ts-expect-error ignore parameter type of mock function
				.mockResolvedValueOnce({
					IsTruncated: true,
					NextContinuationToken: '1',
					Contents: responseContents.slice(0, 1000),
				})
				// @ts-expect-error ignore parameter type of mock function
				.mockResolvedValueOnce({
					IsTruncated: true,
					NextContinuationToken: '2',
					Contents: responseContents.slice(1000, 2000),
				})
				// @ts-expect-error ignore parameter type of mock function
				.mockResolvedValueOnce({
					Contents: responseContents.slice(2000),
				});

			const resultKeys = await service.list(prefix);

			expect(resultKeys).toEqual(keys);

			expect(client.send).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						Prefix: prefix,
						ContinuationToken: undefined,
					},
				})
			);

			expect(client.send).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						Prefix: prefix,
						ContinuationToken: '1',
					},
				})
			);

			expect(client.send).toHaveBeenNthCalledWith(
				3,
				expect.objectContaining({
					input: {
						Bucket: 'test-bucket',
						Prefix: prefix,
						ContinuationToken: '2',
					},
				})
			);
		});

		it('should throw error if client rejects with an error', async () => {
			const { prefix } = setup();

			// @ts-expect-error ignore parameter type of mock function
			client.send.mockRejectedValue(new Error());

			const listPromise = service.list(prefix);

			await expect(listPromise).rejects.toThrow();
		});
	});
});
