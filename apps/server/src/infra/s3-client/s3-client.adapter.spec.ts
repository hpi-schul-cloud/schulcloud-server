import { S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DomainErrorHandler } from '@core/error';
import { ErrorUtils } from '@core/error/utils';
import { Logger } from '@core/logger';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PassThrough, Readable } from 'node:stream';
import { File, S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';
import { createListObjectsV2CommandOutput } from './testing';

const createParameter = () => {
	const bucket = 'test-bucket';
	const clientConnectionName = 'TEST_CONNECTION';
	const config: S3Config = {
		endpoint: '',
		region: '',
		bucket,
		accessKeyId: '',
		secretAccessKey: '',
	};
	const directory = 'test';
	const pathToFile = `${directory}/text.txt`;
	const bytesRange = 'bytes=0-1';

	return { config, pathToFile, bytesRange, bucket, directory, clientConnectionName };
};

describe(S3ClientAdapter.name, () => {
	let service: S3ClientAdapter;
	let client: DeepMocked<S3Client>;
	let errorHandler: DeepMocked<DomainErrorHandler>;

	beforeAll(() => {
		const { config, clientConnectionName } = createParameter();

		const logger = createMock<Logger>();
		const configuration = createMock<S3Config>(config);
		errorHandler = createMock<DomainErrorHandler>();
		client = createMock<S3Client>({
			config: {
				endpoint: () => {
					return { protocol: '', hostname: '' };
				},
			},
		});
		service = new S3ClientAdapter(client, configuration, logger, errorHandler, clientConnectionName);
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
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

				expect(client.send).toHaveBeenCalledWith(
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
					Body: new PassThrough(),
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

				expect(client.send).toHaveBeenCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket, Key: pathToFile },
					})
				);
			});

			it('should call send() of client with bytes range', async () => {
				const { pathToFile, config, bytesRange } = setup();

				await service.get(pathToFile, bytesRange);

				expect(client.send).toHaveBeenCalledWith(
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

				await expect(service.get(pathToFile)).rejects.toThrow(NotFoundException);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup('Unknown Error');

				await expect(service.get(pathToFile)).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('WHEN response body is invalid', () => {
			const setup = (body: unknown) => {
				const { pathToFile } = createParameter();
				const resultObj = {
					Body: body,
					ContentType: 'data.ContentType',
					ContentLength: 'data.ContentLength',
					ContentRange: 'data.ContentRange',
					ETag: 'data.ETag',
				};

				// @ts-expect-error Testcase
				client.send.mockResolvedValueOnce(resultObj);

				return { pathToFile };
			};

			it('should throw InternalServerErrorException when Body is undefined', async () => {
				const { pathToFile } = setup(undefined);

				await expect(service.get(pathToFile)).rejects.toThrow(InternalServerErrorException);
				await expect(service.get(pathToFile)).rejects.toThrow('S3ClientAdapter:get');
			});

			it('should throw InternalServerErrorException when Body is not a Readable stream', async () => {
				const { pathToFile } = setup({ invalid: 'object' });

				await expect(service.get(pathToFile)).rejects.toThrow(InternalServerErrorException);
				await expect(service.get(pathToFile)).rejects.toThrow('S3ClientAdapter:get');
			});

			it('should throw InternalServerErrorException when Body is null', async () => {
				const { pathToFile } = setup(null);

				await expect(service.get(pathToFile)).rejects.toThrow(InternalServerErrorException);
				await expect(service.get(pathToFile)).rejects.toThrow('S3ClientAdapter:get');
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

				expect(service.createBucket).toHaveBeenCalled();
				expect(createSpy).toHaveBeenCalledTimes(2);

				restoreMocks();
			});
		});

		describe('WHEN client throws error', () => {
			const setup = () => {
				const { file } = createFile();
				const { pathToFile } = createParameter();
				const error = new Error('Connection Error');
				const expectedError = new InternalServerErrorException('S3ClientAdapter:create', {
					cause: error,
					description: undefined,
				});

				const uploadDoneMock = jest.spyOn(Upload.prototype, 'done').mockRejectedValueOnce(error);

				const restoreMocks = () => {
					uploadDoneMock.mockRestore();
				};

				return { file, pathToFile, expectedError, restoreMocks };
			};

			it('should throw error from client', async () => {
				const { file, pathToFile, expectedError, restoreMocks } = setup();

				await expect(service.create(pathToFile, file)).rejects.toThrow(expectedError);

				restoreMocks();
			});
		});
	});

	describe('moveToTrash', () => {
		const setup = () => {
			const { pathToFile, bucket } = createParameter();

			return { pathToFile, bucket };
		};

		describe('WHEN paths[] is empty', () => {
			it('should return void', async () => {
				const res = await service.moveToTrash([]);

				expect(res).toEqual(undefined);
			});
		});

		describe('WHEN paths[] is not empty', () => {
			it('should call send() of client with copy objects', async () => {
				const { pathToFile, bucket } = setup();

				await service.moveToTrash([pathToFile]);

				expect(client.send).toHaveBeenCalledWith(
					expect.objectContaining({
						input: { Bucket: bucket, CopySource: `${bucket}/test/text.txt`, Key: 'trash/test/text.txt' },
					})
				);
			});

			it('should call send() of client with delete objects', async () => {
				const { pathToFile, bucket } = setup();

				await service.moveToTrash([pathToFile]);

				expect(client.send).toHaveBeenCalledWith(
					expect.objectContaining({
						input: { Bucket: bucket, Delete: { Objects: [{ Key: 'test/text.txt' }] } },
					})
				);
			});
		});

		describe('WHEN client throws error', () => {
			it('should throw an InternalServerErrorException on error', async () => {
				const { pathToFile } = setup();

				// @ts-expect-error should run into error
				client.send.mockRejectedValue(new S3ServiceException({ name: 'Test error' }));

				await expect(service.moveToTrash([pathToFile])).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('moveDirectoryToTrash', () => {
		describe('when client receives list objects successfully', () => {
			describe('when contents contains key', () => {
				const setup = () => {
					const { pathToFile, bucket, directory } = createParameter();

					const expectedResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: pathToFile }],
						IsTruncated: false,
						KeyCount: 1,
					});
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

					return { pathToFile, bucket, directory };
				};

				it('should call send() of client with directory path', async () => {
					const { pathToFile, bucket } = setup();

					await service.moveDirectoryToTrash(pathToFile);

					expect(client.send).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: 'test/text.txt', MaxKeys: 1000 },
						})
					);
				});

				it('should call send() of client with copy objects', async () => {
					const { directory, bucket } = setup();

					await service.moveDirectoryToTrash(directory);

					expect(client.send).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining({
							input: {
								Bucket: bucket,
								CopySource: `${bucket}/test/text.txt`,
								Key: 'trash/test/text.txt',
							},
						})
					);
				});

				it('should call send() of client with delete objects', async () => {
					const { directory, bucket } = setup();

					await service.moveDirectoryToTrash(directory);

					expect(client.send).toHaveBeenNthCalledWith(
						3,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: 'test/text.txt' }] } },
						})
					);
				});
			});

			describe('when contents contains many keys', () => {
				const setup = () => {
					const { bucket, directory } = createParameter();
					const filePath = `${directory}/test.txt`;
					const nextFilePath = `${directory}/next-test.txt`;

					const expectedResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: filePath }],
						IsTruncated: true,
						KeyCount: 1,
						NextContinuationToken: nextFilePath,
					});

					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);
					// Mock for copy operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});
					// Mock for delete operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});

					const expectedNextResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: nextFilePath }],
						IsTruncated: false,
						KeyCount: 1,
					});
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedNextResponse);
					// Mock for copy operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});
					// Mock for delete operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});

					return { bucket, filePath, nextFilePath, directory };
				};

				it('should call send() of client with directory path', async () => {
					const { bucket, directory, nextFilePath, filePath } = setup();

					await service.moveDirectoryToTrash(directory);

					// First list operation
					expect(client.send).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: directory, MaxKeys: 1000 },
						})
					);
					// First copy operation
					expect(client.send).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining({
							input: { Bucket: bucket, CopySource: `${bucket}/${filePath}`, Key: `trash/${filePath}` },
						})
					);
					// First delete operation
					expect(client.send).toHaveBeenNthCalledWith(
						3,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: filePath }] } },
						})
					);
					// Second list operation (with continuation token)
					expect(client.send).toHaveBeenNthCalledWith(
						4,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: directory, ContinuationToken: nextFilePath, MaxKeys: 1000 },
						})
					);
					// Second copy operation
					expect(client.send).toHaveBeenNthCalledWith(
						5,
						expect.objectContaining({
							input: { Bucket: bucket, CopySource: `${bucket}/${nextFilePath}`, Key: `trash/${nextFilePath}` },
						})
					);
					// Second delete operation
					expect(client.send).toHaveBeenNthCalledWith(
						6,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: nextFilePath }] } },
						})
					);
				});
			});

			describe('When contents contain invalid keys', () => {
				const setup = () => {
					const { pathToFile, bucket } = createParameter();
					const expectedResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: undefined }],
						IsTruncated: false,
						KeyCount: 1,
					});
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

					return { pathToFile, bucket };
				};

				it('should call client send with correct params', async () => {
					const { pathToFile } = setup();

					await service.moveDirectoryToTrash(pathToFile);

					// Only called once for listing objects
					expect(client.send).toHaveBeenCalledTimes(1);
				});
			});

			describe('when listObjects call throw an error', () => {
				const setup = () => {
					const { pathToFile } = createParameter();
					const error = new Error('testError');
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockRejectedValueOnce(error);

					const expectedError = new InternalServerErrorException(
						'S3ClientAdapter:moveDirectoryToTrash',
						ErrorUtils.createHttpExceptionOptions(error)
					);

					return { pathToFile, expectedError };
				};

				it('should return InternalServerErrorException', async () => {
					const { pathToFile, expectedError } = setup();

					await expect(service.moveDirectoryToTrash(pathToFile)).rejects.toThrow(expectedError);
				});
			});
		});
	});

	describe('delete', () => {
		const setup = () => {
			const { pathToFile, bucket } = createParameter();

			return { pathToFile, bucket };
		};

		describe('WHEN paths[] is empty', () => {
			it('should return void', async () => {
				const res = await service.delete([]);

				expect(res).toEqual(undefined);
			});
		});

		describe('WHEN paths[] is not empty', () => {
			it('should call send() of client with delete objects', async () => {
				const { pathToFile, bucket } = setup();

				await service.delete([pathToFile]);

				expect(client.send).toHaveBeenCalledWith(
					expect.objectContaining({
						input: { Bucket: bucket, Delete: { Objects: [{ Key: 'test/text.txt' }] } },
					})
				);
			});
		});

		describe('WHEN client throws error', () => {
			it('should throw an InternalServerErrorException on error', async () => {
				const { pathToFile } = setup();

				// @ts-expect-error should run into error
				client.send.mockRejectedValue(new S3ServiceException({ name: 'Test error' }));

				await expect(service.delete([pathToFile])).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('deleteDirectory', () => {
		describe('when client receives list objects successfully', () => {
			describe('When contents contain invalid keys', () => {
				const setup = () => {
					const { directory } = createParameter();
					const expectedResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: undefined }],
						IsTruncated: false,
						KeyCount: 1,
					});
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

					return { directory };
				};

				it('should only call client.send once', async () => {
					const { directory } = setup();

					await service.deleteDirectory(directory);

					// Only called once for listing objects
					expect(client.send).toHaveBeenCalledTimes(1);
				});
			});

			describe('when contents contains key', () => {
				const setup = () => {
					const { pathToFile, bucket, directory } = createParameter();

					const expectedResponse = createListObjectsV2CommandOutput.build({ Contents: [{ Key: pathToFile }] });
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

					return { pathToFile, bucket, directory };
				};

				it('should call send() of client with directory path', async () => {
					const { bucket, directory } = setup();

					await service.deleteDirectory(directory);

					expect(client.send).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: directory, MaxKeys: 1000 },
						})
					);
				});

				it('should call send() with objects to delete', async () => {
					const { pathToFile, bucket, directory } = setup();

					await service.deleteDirectory(directory);

					expect(client.send).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: pathToFile }] } },
						})
					);
				});
			});

			describe('when contents contains many keys', () => {
				const setup = () => {
					const { bucket, directory } = createParameter();
					const filePath = `${directory}/test.txt`;
					const nextFilePath = `${directory}/next-test.txt`;

					const expectedResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: filePath }],
						IsTruncated: true,
						KeyCount: 1,
						NextContinuationToken: nextFilePath,
					});

					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

					// Mock for delete operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});

					const expectedNextResponse = createListObjectsV2CommandOutput.build({
						Contents: [{ Key: nextFilePath }],
						IsTruncated: false,
						KeyCount: 1,
					});

					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedNextResponse);

					// Mock for delete operation
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce({});

					return { bucket, filePath, nextFilePath, directory };
				};

				it('should call send() of client with directory path', async () => {
					const { bucket, directory, nextFilePath, filePath } = setup();

					await service.deleteDirectory(directory);

					// First list operation
					expect(client.send).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: directory, MaxKeys: 1000 },
						})
					);
					// First delete operation
					expect(client.send).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: filePath }] } },
						})
					);
					// Second list operation (with continuation token)
					expect(client.send).toHaveBeenNthCalledWith(
						3,
						expect.objectContaining({
							input: { Bucket: bucket, Prefix: directory, ContinuationToken: nextFilePath, MaxKeys: 1000 },
						})
					);
					// Second delete operation
					expect(client.send).toHaveBeenNthCalledWith(
						4,
						expect.objectContaining({
							input: { Bucket: bucket, Delete: { Objects: [{ Key: nextFilePath }] } },
						})
					);
				});
			});

			describe('when contents is undefined', () => {
				const setup = () => {
					const { pathToFile } = createParameter();
					const expectedResponse = createListObjectsV2CommandOutput.build({});
					// @ts-expect-error ignore parameter type of mock function
					client.send.mockResolvedValueOnce(expectedResponse);

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
					// @ts-expect-error ignore parameter type of mock function
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

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'S3ClientAdapter:deleteDirectory',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				return { pathToFile, filePath, expectedError };
			};

			it('should return InternalServerErrorException', async () => {
				const { pathToFile, expectedError } = setup();

				await expect(service.deleteDirectory(pathToFile)).rejects.toThrow(expectedError);
			});
		});

		describe('when client throws error when trying to delete files', () => {
			const setup = () => {
				const { pathToFile } = createParameter();
				const filePath = 'directory/test.txt';
				const error = new Error('Delete failed');

				const expectedResponse = createListObjectsV2CommandOutput.build({
					Contents: [{ Key: filePath }],
					IsTruncated: false,
					KeyCount: 1,
				});
				// @ts-expect-error ignore parameter type of mock function
				client.send.mockResolvedValueOnce(expectedResponse);

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'S3ClientAdapter:deleteDirectory',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				return { pathToFile, filePath, expectedError };
			};

			it('should return InternalServerErrorException', async () => {
				const { pathToFile, expectedError } = setup();

				await expect(service.deleteDirectory(pathToFile)).rejects.toThrow(expectedError);
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

			expect(client.send).toHaveBeenCalledWith(
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

			expect(client.send).toHaveBeenCalledWith(
				expect.objectContaining({
					input: { Bucket: bucket, Delete: { Objects: [{ Key: 'trash/test/text.txt' }] } },
				})
			);
		});

		it('should throw an InternalServerErrorException by error', async () => {
			const { pathToFile } = setup();

			// @ts-expect-error should run into error
			client.send.mockRejectedValue(new Error('Test error'));

			await expect(service.restore([pathToFile])).rejects.toThrow(InternalServerErrorException);
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

		describe('when client send resolves successfully', () => {
			it('should call send() of client with copy objects', async () => {
				const { pathsToCopy, bucket } = setup();

				await service.copy(pathsToCopy);

				expect(client.send).toHaveBeenCalledWith(
					expect.objectContaining({
						input: {
							Bucket: bucket,
							CopySource: `${bucket}/trash/test/text.txt`,
							Key: 'test/text.txt',
						},
					})
				);
			});
		});

		describe('when client send rejects with error', () => {
			it('should return empty array', async () => {
				const { pathsToCopy } = setup();

				// @ts-expect-error should run into error
				client.send.mockRejectedValueOnce(new Error('Test error'));

				const result = await service.copy(pathsToCopy);

				expect(result).toEqual([]);
			});

			it('should call errorHandler.exec when promises are rejected', async () => {
				const { pathsToCopy } = setup();

				// @ts-expect-error should run into error
				client.send.mockRejectedValueOnce(new Error('Test error'));

				await service.copy(pathsToCopy);

				expect(errorHandler.exec).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'S3ClientAdapter:copy:settledPromises',
					})
				);
			});
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

				expect(client.send).toHaveBeenCalledWith(
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

				expect(client.send).toHaveBeenCalledWith(
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
					NextContinuationToken: 'KEY-1000',
				});

				// @ts-expect-error ignore parameter type of mock function
				client.send.mockResolvedValueOnce({
					IsTruncated: true,
					Contents: responseContents.slice(1000, 1200),
					NextContinuationToken: 'KEY-1200',
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

				const resultKeys = await service.list({ path });

				expect(resultKeys.files).toEqual(keys);

				expect(client.send).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						input: {
							Bucket: 'test-bucket',
							Prefix: path,
							ContinuationToken: undefined,
							MaxKeys: 1000,
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
							MaxKeys: 1000,
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
							MaxKeys: 1000,
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

	describe('handleUploadAbortion', () => {
		const setup = () => {
			const { pathToFile } = createParameter();
			const mockUpload = createMock<Upload>();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const serviceAsAny = service as any;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const mockLogger = serviceAsAny.logger;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			return { pathToFile, mockUpload, mockLogger, serviceAsAny };
		};

		describe('WHEN upload abortion is handled', () => {
			it('should log warning and call upload.abort() for uploadAlreadyAborted action', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const action = 'uploadAlreadyAborted';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, action);

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});

			it('should log warning and call upload.abort() for uploadAborted action', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const action = 'uploadAborted';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, action);

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});

			it('should log warning and call upload.abort() for uploadStreamError action', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const action = 'uploadStreamError';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, action);

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});

			it('should handle custom action strings', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const customAction = 'customAbortReason';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, customAction);

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action: customAction,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});

			it('should handle different path formats', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { mockUpload, mockLogger, serviceAsAny } = setup();
				const differentPath = 'folder/subfolder/file.pdf';
				const action = 'uploadAborted';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(differentPath, mockUpload, action);

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: differentPath,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});
		});

		describe('WHEN upload.abort() throws an error', () => {
			it('should throw the error from upload.abort() but still log the warning first', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const action = 'uploadAborted';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');
				mockUpload.abort.mockImplementation(() => {
					throw new Error('Abort failed');
				});

				// Should throw an error when abort fails
				expect(() => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
					serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, action);
				}).toThrow('Abort failed');

				expect(loggerWarningSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});

			it('should log warning when upload.abort() promise is rejected', async () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, mockLogger, serviceAsAny } = setup();
				const action = 'uploadAborted';

				const loggerWarningSpy = jest.spyOn(mockLogger, 'warning');
				mockUpload.abort.mockRejectedValue(new Error('Abort promise rejected'));

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.handleUploadAbortion(pathToFile, mockUpload, action);

				// Wait for the promise to be rejected and caught
				await new Promise((resolve) => setImmediate(resolve));

				expect(loggerWarningSpy).toHaveBeenCalledTimes(2);
				expect(loggerWarningSpy).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action,
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(loggerWarningSpy).toHaveBeenNthCalledWith(
					2,
					expect.objectContaining({
						message: 'Failed to abort upload',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action: 'abortUploadError',
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(mockUpload.abort).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('setupUploadErrorHandling', () => {
		const setup = () => {
			const { pathToFile } = createParameter();
			const mockUpload = createMock<Upload>();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const serviceAsAny = service as any;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const mockLogger = serviceAsAny.logger;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			return { pathToFile, mockUpload, serviceAsAny, mockLogger };
		};

		describe('WHEN file has abortSignal', () => {
			describe('AND abortSignal is already aborted', () => {
				it('should call handleUploadAbortion immediately with uploadAlreadyAborted action', () => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { pathToFile, mockUpload, serviceAsAny } = setup();
					const mockAbortController = new AbortController();
					mockAbortController.abort();

					const file: File = {
						data: Readable.from(Buffer.from('test data')),
						mimeType: 'text/plain',
						abortSignal: mockAbortController.signal,
					};

					const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
					serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

					expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadAlreadyAborted');
					expect(handleUploadAbortionSpy).toHaveBeenCalledTimes(1);
				});

				it('should return early and not add abort event listener', () => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { pathToFile, mockUpload, serviceAsAny } = setup();
					const mockAbortController = new AbortController();
					mockAbortController.abort();

					const file: File = {
						data: Readable.from(Buffer.from('test data')),
						mimeType: 'text/plain',
						abortSignal: mockAbortController.signal,
					};

					const addEventListenerSpy = jest.spyOn(mockAbortController.signal, 'addEventListener');
					const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
					serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

					// Should call handleUploadAbortion immediately
					expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadAlreadyAborted');
					// Should not add event listener since it returns early
					expect(addEventListenerSpy).not.toHaveBeenCalled();
				});
			});

			describe('AND abortSignal is not yet aborted', () => {
				it('should add abort event listener that calls handleUploadAbortion', () => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { pathToFile, mockUpload, serviceAsAny } = setup();
					const mockAbortController = new AbortController();

					const file: File = {
						data: Readable.from(Buffer.from('test data')),
						mimeType: 'text/plain',
						abortSignal: mockAbortController.signal,
					};

					const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
					serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

					// Should not call immediately since signal is not aborted
					expect(handleUploadAbortionSpy).not.toHaveBeenCalled();

					// Trigger the abort signal
					mockAbortController.abort();

					// Now it should have been called
					expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadAborted');
					expect(handleUploadAbortionSpy).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe('WHEN file has no abortSignal', () => {
			it('should not call handleUploadAbortion for signal-related events', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
					// No abortSignal property
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				expect(handleUploadAbortionSpy).not.toHaveBeenCalled();
			});
		});

		describe('WHEN file data is a stream', () => {
			it('should add error event listener to stream', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const mockStream = new PassThrough();
				const file: File = {
					data: mockStream,
					mimeType: 'text/plain',
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');
				const streamOnSpy = jest.spyOn(mockStream, 'on');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				expect(streamOnSpy).toHaveBeenCalledWith('error', expect.any(Function));

				// Trigger the error event
				mockStream.emit('error', new Error('Stream error'));

				expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadStreamError');
				expect(handleUploadAbortionSpy).toHaveBeenCalledTimes(1);
			});

			it('should work with Readable stream', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const mockStream = Readable.from(['test data']);
				const file: File = {
					data: mockStream,
					mimeType: 'text/plain',
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');
				const streamOnSpy = jest.spyOn(mockStream, 'on');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				expect(streamOnSpy).toHaveBeenCalledWith('error', expect.any(Function));

				// Trigger the error event
				mockStream.emit('error', new Error('Stream error'));

				expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadStreamError');
			});
		});

		describe('WHEN file data is not a stream', () => {
			it('should not add error event listener for Buffer data', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				// Should not call handleUploadAbortion since Buffer doesn't have error events
				expect(handleUploadAbortionSpy).not.toHaveBeenCalled();
			});

			it('should not add error event listener for string data', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const file: File = {
					data: Readable.from(['test data string']),
					mimeType: 'text/plain',
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				expect(handleUploadAbortionSpy).not.toHaveBeenCalled();
			});
		});

		describe('WHEN file has both abortSignal and stream data', () => {
			it('should handle both abort signal and stream error events', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				const mockAbortController = new AbortController();
				const mockStream = new PassThrough();
				const file: File = {
					data: mockStream,
					mimeType: 'text/plain',
					abortSignal: mockAbortController.signal,
				};

				const handleUploadAbortionSpy = jest.spyOn(serviceAsAny, 'handleUploadAbortion');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				// Trigger abort signal
				mockAbortController.abort();

				expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadAborted');

				// Reset spy
				handleUploadAbortionSpy.mockClear();

				// Trigger stream error
				mockStream.emit('error', new Error('Stream error'));

				expect(handleUploadAbortionSpy).toHaveBeenCalledWith(pathToFile, mockUpload, 'uploadStreamError');
				expect(handleUploadAbortionSpy).toHaveBeenCalledTimes(1);
			});
		});

		describe('WHEN object has "on" method but is not a stream', () => {
			it('should still add error listener for objects with "on" method', () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const { pathToFile, mockUpload, serviceAsAny } = setup();
				interface MockEventEmitter {
					on: jest.Mock;
					emit: jest.Mock;
				}

				const mockEventEmitter: MockEventEmitter = {
					on: jest.fn(),
					emit: jest.fn(),
				};

				const file: File = {
					data: mockEventEmitter as unknown as Readable,
					mimeType: 'text/plain',
				};

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				serviceAsAny.setupUploadErrorHandling(mockUpload, pathToFile, file);

				expect(mockEventEmitter.on).toHaveBeenCalledWith('error', expect.any(Function));
			});
		});
	});
});
