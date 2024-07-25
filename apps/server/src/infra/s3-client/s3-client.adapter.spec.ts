import { S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorUtils } from '@src/core/error/utils';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'node:stream';
import { S3_CLIENT, S3_CONFIG } from './constants';
import { File, S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';

const createParameter = () => {
	const bucket = 'test-bucket';
	const config = {
		endpoint: '',
		region: '',
		bucket,
		accessKeyId: '',
		secretAccessKey: '',
	};
	const pathToFile = 'test/text.txt';
	const bytesRange = 'bytes=0-1';

	return { config, pathToFile, bytesRange, bucket };
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
					provide: S3_CLIENT,
					useValue: createMock<S3Client>({
						config: {
							endpoint: () => {
								return { protocol: '', hostname: '' };
							},
						},
					}),
				},
				{
					provide: S3_CONFIG,
					useValue: createMock<S3Config>(config),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(S3ClientAdapter);
		client = module.get(S3_CLIENT);
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
				// @ts-expect-error Testcase
				client.send.mockRejectedValueOnce({ Code: errorKey });

				return { pathToFile };
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
			const file: File = {
				data: readable,
				mimeType: 'text/plain',
			};

			return { file };
		};

		describe('WHEN file is created successfully', () => {
			const setup = () => {
				const { file } = createFile();
				const { pathToFile } = createParameter();

				return { file, pathToFile };
			};

			it('should return data', async () => {
				const { file, pathToFile } = setup();

				const result = await service.create(pathToFile, file);

				expect(result).toBeDefined();
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

				const restoreMocks = () => {
					uploadDoneMock.mockRestore();
					createBucketMock.mockRestore();
					createSpy.mockRestore();
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
				const error = new InternalServerErrorException('S3ClientAdapter:create');

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
			const { pathToFile, bucket } = createParameter();

			return { pathToFile, bucket };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathToFile, bucket } = setup();

			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: bucket, CopySource: `${bucket}/test/text.txt`, Key: 'trash/test/text.txt' },
				})
			);
		});

		it('should call send() of client with delete objects', async () => {
			const { pathToFile, bucket } = setup();

			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: bucket, Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});

		it('should return empty array on error with Code "NoSuchKey"', async () => {
			const { pathToFile } = setup();

			// @ts-expect-error should run into error
			client.send.mockRejectedValue(new S3ServiceException({ name: 'NoSuchKey' }));

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
			const { pathToFile, bucket } = createParameter();

			return { pathToFile, bucket };
		};

		it('should call send() of client with delete objects', async () => {
			const { pathToFile, bucket } = setup();

			await service.delete([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: bucket, Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});
	});

	describe('deleteDirectory', () => {
		describe('when client receives list objects successfully', () => {
			describe('when contents contains key', () => {
				const setup = () => {
					const { pathToFile, bucket } = createParameter();
					const filePath = 'directory/test.txt';
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					client.send.mockResolvedValueOnce({ Contents: [{ Key: filePath }] });

					return { pathToFile, bucket, filePath };
				};

				it('should call send() of client with directory path', async () => {
					const { pathToFile, bucket } = setup();

					await service.deleteDirectory(pathToFile);

					expect(client.send).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: 'test/text.txt' },
						})
					);
				});

				it('should call send() with objects to delete', async () => {
					const { pathToFile, bucket, filePath } = setup();

					await service.deleteDirectory(pathToFile);

					expect(client.send).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: filePath }] } },
						})
					);
				});
			});

			describe('when contents is undefined', () => {
				const setup = () => {
					const { pathToFile } = createParameter();
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					client.send.mockResolvedValueOnce({});

					return { pathToFile };
				};

				it('should call send() once', async () => {
					const { pathToFile } = setup();

					await service.deleteDirectory(pathToFile);

					expect(client.send).toHaveBeenCalledTimes(1);
				});
			});

			describe('when contents is empty array', () => {
				const setup = () => {
					const { pathToFile } = createParameter();
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					client.send.mockResolvedValueOnce({ Contents: [] });

					return { pathToFile };
				};

				it('should not call send() once', async () => {
					const { pathToFile } = setup();

					await service.deleteDirectory(pathToFile);

					expect(client.send).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe('when client throws error when trying to receive list objects ', () => {
			const setup = () => {
				const { pathToFile } = createParameter();
				const filePath = 'directory/test.txt';
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				client.send.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'S3ClientAdapter:deleteDirectory',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				return { pathToFile, filePath, expectedError };
			};

			it('should return InternalServerErrorException', async () => {
				const { pathToFile, expectedError } = setup();

				await expect(service.deleteDirectory(pathToFile)).rejects.toThrowError(expectedError);
			});
		});

		describe('when client throws error when trying to delete files', () => {
			const setup = () => {
				const { pathToFile } = createParameter();
				const filePath = 'directory/test.txt';
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				client.send.mockResolvedValueOnce({ Contents: [{ Key: filePath }] });
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				client.send.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'S3ClientAdapter:deleteDirectory',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				return { pathToFile, filePath, expectedError };
			};

			it('should return InternalServerErrorException', async () => {
				const { pathToFile, expectedError } = setup();

				await expect(service.deleteDirectory(pathToFile)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('restore', () => {
		const setup = () => {
			const { pathToFile, bucket } = createParameter();

			return { pathToFile, bucket };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathToFile, bucket } = setup();

			await service.restore([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Bucket: bucket,
						CopySource: `${bucket}/trash/test/text.txt`,
						Key: 'test/text.txt',
					},
				})
			);
		});

		it('should call send() of client with delete objects', async () => {
			const { pathToFile, bucket } = setup();

			await service.restore([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: bucket, Delete: { Objects: [{ Key: 'trash/test/text.txt' }] } },
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
			const { bucket } = createParameter();
			const pathsToCopy = [
				{
					sourcePath: 'trash/test/text.txt',
					targetPath: 'test/text.txt',
				},
			];

			return { pathsToCopy, bucket };
		};

		it('should call send() of client with copy objects', async () => {
			const { pathsToCopy, bucket } = setup();

			await service.copy(pathsToCopy);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Bucket: bucket,
						CopySource: `${bucket}/trash/test/text.txt`,
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
			it('should throw HttpException', async () => {
				const { pathToFile } = setup();
				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValueOnce(new Error('NoSuchKey'));

				const headPromise = service.head(pathToFile);

				await expect(headPromise).rejects.toBeInstanceOf(HttpException);
			});
		});
		describe('when file exist and failed', () => {
			it('should throw InternalServerErrorException', async () => {
				const { pathToFile } = setup();
				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValueOnce(new Error('Dummy'));

				const headPromise = service.head(pathToFile);

				await expect(headPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});
	});

	describe('list', () => {
		const setup = () => {
			const path = 'test/';

			const keys = Array.from(Array(2500).keys()).map((n) => `KEY-${n}`);
			const responseContents = keys.map((key) => {
				return {
					Key: `${path}${key}`,
				};
			});

			return { path, keys, responseContents };
		};

		afterEach(() => {
			client.send.mockClear();
		});

		describe('when maxKeys is given', () => {
			it('should truncate result', async () => {
				const { path, keys, responseContents } = setup();

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockResolvedValue({
					IsTruncated: false,
					Contents: responseContents.slice(0, 500),
				});

				const resultKeys = await service.list({ path, maxKeys: 500 });

				expect(resultKeys.files).toEqual(keys.slice(0, 500));

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: undefined,
							MaxKeys: 500,
						},
					})
				);
			});

			it('should truncate result by S3 limits', async () => {
				const { path, keys, responseContents } = setup();

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockResolvedValueOnce({
					IsTruncated: true,
					Contents: responseContents.slice(0, 1000),
					ContinuationToken: 'KEY-1000',
				});

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockResolvedValueOnce({
					IsTruncated: true,
					Contents: responseContents.slice(1000, 1200),
					ContinuationToken: 'KEY-1200',
				});

				const resultKeys = await service.list({ path, maxKeys: 1200 });

				expect(resultKeys.files).toEqual(keys.slice(0, 1200));

				expect(client.send).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: undefined,
							MaxKeys: 1200,
						},
					})
				);

				expect(client.send).toHaveBeenNthCalledWith(
					2,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: 'KEY-1000',
							MaxKeys: 200,
						},
					})
				);

				expect(client.send).toHaveBeenCalledTimes(2);
			});
		});

		describe('when maxKeys is not given', () => {
			it('should call send() multiple times if bucket contains more than 1000 keys', async () => {
				const { path, responseContents, keys } = setup();

				client.send
					// @ts-expect-error ignore parameter type of mock function
					.mockResolvedValueOnce({
						IsTruncated: true,
						ContinuationToken: '1',
						Contents: responseContents.slice(0, 1000),
					})
					// @ts-expect-error ignore parameter type of mock function
					.mockResolvedValueOnce({
						IsTruncated: true,
						ContinuationToken: '2',
						Contents: responseContents.slice(1000, 2000),
					})
					// @ts-expect-error ignore parameter type of mock function
					.mockResolvedValueOnce({
						Contents: responseContents.slice(2000),
					});

				const resultKeys = await service.list({ path });

				expect(resultKeys.files).toEqual(keys);

				expect(client.send).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: undefined,
						},
					})
				);

				expect(client.send).toHaveBeenNthCalledWith(
					2,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: '1',
						},
					})
				);

				expect(client.send).toHaveBeenNthCalledWith(
					3,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: '2',
						},
					})
				);
			});
		});

		describe('when client rejects with an error', () => {
			it('should throw error', async () => {
				const { path } = setup();

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValue(new Error());

				const listPromise = service.list({ path });

				await expect(listPromise).rejects.toThrow();
			});
		});
	});
});
