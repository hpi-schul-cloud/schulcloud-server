import { CompleteMultipartUploadCommandOutput, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
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
	let logger: DeepMocked<Logger>;

	beforeAll(() => {
		const { config, clientConnectionName } = createParameter();

		logger = createMock<Logger>();
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

		describe('stream timeout and error handling', () => {
			const setup = () => {
				const { pathToFile } = createParameter();
				const sourceStream = new PassThrough();
				const resultObj = {
					Body: sourceStream,
					ContentType: 'data.ContentType',
					ContentLength: 'data.ContentLength',
					ContentRange: 'data.ContentRange',
					ETag: 'data.ETag',
				};

				// @ts-expect-error Testcase
				client.send.mockResolvedValueOnce(resultObj);

				return { pathToFile, sourceStream };
			};

			describe('WHEN source stream emits an error', () => {
				it('should log the source stream error and destroy the passthrough stream', async () => {
					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					sourceStream.emit('error', new Error('Source error'));

					expect(logger.warning).toHaveBeenCalledWith(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						expect.objectContaining({ message: expect.stringContaining('Source stream error: Source error') })
					);
					expect(passthroughStream.destroyed).toBe(true);
				});
			});

			describe('WHEN passthrough stream emits an error', () => {
				it('should log the passthrough stream error and destroy the source stream', async () => {
					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					passthroughStream.emit('error', new Error('Passthrough error'));

					expect(logger.warning).toHaveBeenCalledWith(
						expect.objectContaining({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('Passthrough stream error: Passthrough error'),
						})
					);
					expect(sourceStream.destroyed).toBe(true);
				});
			});

			describe('WHEN source stream is already destroyed when passthrough emits an error', () => {
				it('should not call destroy() on the already-destroyed source stream', async () => {
					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					sourceStream.destroy();
					const destroySpy = jest.spyOn(sourceStream, 'destroy');

					passthroughStream.emit('error', new Error('Passthrough error'));

					expect(destroySpy).not.toHaveBeenCalled();
				});
			});

			describe('WHEN passthrough stream is already destroyed when source emits an error', () => {
				it('should not call destroy() on the already-destroyed passthrough stream', async () => {
					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					passthroughStream.destroy();
					const destroySpy = jest.spyOn(passthroughStream, 'destroy');

					sourceStream.emit('error', new Error('Source error'));

					expect(destroySpy).not.toHaveBeenCalled();
				});
			});

			describe('WHEN timeout fires and streams are not yet destroyed', () => {
				it('should destroy both streams and log stream unresponsive', async () => {
					jest.useFakeTimers();

					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					jest.advanceTimersByTime(60 * 1000 + 1);

					expect(logger.info).toHaveBeenCalledWith(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						expect.objectContaining({ message: expect.stringContaining('Stream unresponsive') })
					);
					expect(sourceStream.destroyed).toBe(true);
					expect(passthroughStream.destroyed).toBe(true);

					jest.useRealTimers();
				});
			});

			describe('WHEN timeout fires but both streams are already destroyed', () => {
				it('should not log stream unresponsive and should not attempt additional destroys', async () => {
					jest.useFakeTimers();

					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					sourceStream.destroy();
					passthroughStream.destroy();

					const sourceDestroySpy = jest.spyOn(sourceStream, 'destroy');
					const passthroughDestroySpy = jest.spyOn(passthroughStream, 'destroy');

					jest.advanceTimersByTime(60 * 1000 + 1);

					expect(logger.info).not.toHaveBeenCalled();
					expect(sourceDestroySpy).not.toHaveBeenCalled();
					expect(passthroughDestroySpy).not.toHaveBeenCalled();

					jest.useRealTimers();
				});
			});

			describe('WHEN source stream emits data', () => {
				it('should refresh the timeout so it does not fire at the original deadline', async () => {
					jest.useFakeTimers();

					const { pathToFile, sourceStream } = setup();

					const result = await service.get(pathToFile);
					const passthroughStream = result.data;

					// Advance to just before the timeout
					jest.advanceTimersByTime(59 * 1000);

					// Emit data to refresh the timer
					sourceStream.emit('data', Buffer.from('chunk'));

					// Advance past the original 60 s deadline (only 1 s elapsed since refresh)
					jest.advanceTimersByTime(2 * 1000);

					// Timer was refreshed, so neither stream should be destroyed yet
					expect(sourceStream.destroyed).toBe(false);
					expect(passthroughStream.destroyed).toBe(false);

					jest.useRealTimers();
				});
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

		describe('WHEN abortSignal is already aborted', () => {
			it('should log upload aborted warning and call upload.abort() once', async () => {
				const { pathToFile } = createParameter();
				const abortController = new AbortController();
				abortController.abort();

				const completeMultipartUploadCommandOutputMock = createMock<CompleteMultipartUploadCommandOutput>();
				jest.spyOn(Upload.prototype, 'done').mockResolvedValueOnce(completeMultipartUploadCommandOutputMock);
				const uploadAbortSpy = jest.spyOn(Upload.prototype, 'abort').mockResolvedValueOnce(undefined);

				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
					abortSignal: abortController.signal,
				};

				await service.create(pathToFile, file);

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action: 'uploadAlreadyAborted',
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(uploadAbortSpy).toHaveBeenCalledTimes(1);
				expect(logger.warning).toHaveBeenCalledTimes(1);
			});
		});

		describe('WHEN abortSignal fires during upload', () => {
			it('should log upload aborted warning when abort signal fires', async () => {
				const { pathToFile } = createParameter();
				const abortController = new AbortController();

				let resolveDone!: (value) => void;
				jest.spyOn(Upload.prototype, 'done').mockReturnValueOnce(
					new Promise((resolve) => {
						resolveDone = resolve;
					})
				);
				jest.spyOn(Upload.prototype, 'abort').mockResolvedValueOnce(undefined);

				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
					abortSignal: abortController.signal,
				};

				const createPromise = service.create(pathToFile, file);

				abortController.abort();
				resolveDone({});

				await createPromise;

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action: 'uploadAborted',
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
			});
		});

		describe('WHEN file has no abortSignal', () => {
			it('should not log upload aborted warning', async () => {
				const { pathToFile } = createParameter();

				const completeMultipartUploadCommandOutputMock = createMock<CompleteMultipartUploadCommandOutput>();
				jest.spyOn(Upload.prototype, 'done').mockResolvedValueOnce(completeMultipartUploadCommandOutputMock);

				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
				};

				await service.create(pathToFile, file);

				expect(logger.warning).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'Upload aborted' }));
			});
		});

		describe('WHEN file data stream emits an error', () => {
			it('should log upload aborted warning with uploadStreamError action and call abort', async () => {
				const { pathToFile } = createParameter();
				const mockStream = new PassThrough();

				let resolveDone!: (value) => void;
				jest.spyOn(Upload.prototype, 'done').mockReturnValueOnce(
					new Promise((resolve) => {
						resolveDone = resolve;
					})
				);
				const uploadAbortSpy = jest.spyOn(Upload.prototype, 'abort').mockResolvedValueOnce(undefined);

				const file: File = {
					data: mockStream,
					mimeType: 'text/plain',
				};

				const createPromise = service.create(pathToFile, file);

				mockStream.emit('error', new Error('Stream error'));
				resolveDone({});

				await createPromise;

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({
							action: 'uploadStreamError',
							objectPath: pathToFile,
							bucket: 'test-bucket',
						}),
					})
				);
				expect(uploadAbortSpy).toHaveBeenCalledTimes(1);
			});
		});

		describe('WHEN file has both abortSignal and stream data', () => {
			it('should handle abort signal and stream error independently', async () => {
				const { pathToFile } = createParameter();
				const abortController = new AbortController();
				const mockStream = new PassThrough();

				let resolveDone!: (value) => void;
				jest.spyOn(Upload.prototype, 'done').mockReturnValueOnce(
					new Promise((resolve) => {
						resolveDone = resolve;
					})
				);
				jest.spyOn(Upload.prototype, 'abort').mockResolvedValue(undefined);

				const file: File = {
					data: mockStream,
					mimeType: 'text/plain',
					abortSignal: abortController.signal,
				};

				const createPromise = service.create(pathToFile, file);

				abortController.abort();

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({ action: 'uploadAborted' }),
					})
				);

				mockStream.emit('error', new Error('Stream error'));

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({ action: 'uploadStreamError' }),
					})
				);

				resolveDone({});
				await createPromise;
			});
		});

		describe('WHEN upload.abort() promise is rejected', () => {
			it('should log failed to abort upload warning', async () => {
				const { pathToFile } = createParameter();
				const abortController = new AbortController();
				abortController.abort();

				const completeMultipartUploadCommandOutputMock = createMock<CompleteMultipartUploadCommandOutput>();
				jest.spyOn(Upload.prototype, 'done').mockResolvedValueOnce(completeMultipartUploadCommandOutputMock);
				jest.spyOn(Upload.prototype, 'abort').mockRejectedValueOnce(new Error('Abort promise rejected'));

				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
					abortSignal: abortController.signal,
				};

				await service.create(pathToFile, file);

				await new Promise((resolve) => setImmediate(resolve));

				expect(logger.warning).toHaveBeenCalledTimes(2);
				expect(logger.warning).toHaveBeenNthCalledWith(
					1,
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({ action: 'uploadAlreadyAborted' }),
					})
				);
				expect(logger.warning).toHaveBeenNthCalledWith(
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
			});
		});

		describe('WHEN upload.abort() throws synchronously', () => {
			it('should still log upload aborted warning before error propagates through create', async () => {
				const { pathToFile } = createParameter();
				const abortController = new AbortController();
				abortController.abort();

				jest.spyOn(Upload.prototype, 'abort').mockImplementation(() => {
					throw new Error('Abort failed');
				});

				const file: File = {
					data: Readable.from(Buffer.from('test data')),
					mimeType: 'text/plain',
					abortSignal: abortController.signal,
				};

				await expect(service.create(pathToFile, file)).rejects.toThrow(InternalServerErrorException);

				expect(logger.warning).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'Upload aborted',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						payload: expect.objectContaining({ action: 'uploadAlreadyAborted' }),
					})
				);
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
});
