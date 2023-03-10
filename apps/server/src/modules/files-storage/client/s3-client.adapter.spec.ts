import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { Readable } from 'node:stream';
import { FileDto } from '../dto';
import { S3Config } from '../interface/config';
import { S3ClientAdapter } from './s3-client.adapter';

const config = {
	endpoint: '',
	region: '',
	bucket: 'test-bucket',
	accessKeyId: '',
	secretAccessKey: '',
};

const pathToFile = 'test/text.txt';
const bytesRange = 'bytes=0-1';

describe('S3ClientAdapter', () => {
	let module: TestingModule;
	let service: S3ClientAdapter;
	let client: DeepMocked<S3Client>;

	beforeAll(async () => {
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
					provide: Logger,
					useValue: createMock<Logger>(),
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
			it('should call send() of client', async () => {
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
				const resultObj = {
					Body: { on: () => true },
					ContentType: 'data.ContentType',
					ContentLength: 'data.ContentLength',
					ContentRange: 'data.ContentRange',
					ETag: 'data.ETag',
				};

				// @ts-expect-error Testcase
				client.send.mockResolvedValueOnce(resultObj);
			};

			it('should call send() of client', async () => {
				setup();

				await service.get(pathToFile);

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket, Key: pathToFile },
					})
				);
			});

			it('should call send() of client with bytes range', async () => {
				setup();

				await service.get(pathToFile, bytesRange);

				expect(client.send).toBeCalledWith(
					expect.objectContaining({
						input: { Bucket: config.bucket, Key: pathToFile, Range: bytesRange },
					})
				);
			});

			it('should return file', async () => {
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
				const error = new Error(errorKey);
				// @ts-expect-error Testcase
				client.send.mockRejectedValueOnce(error);

				return { error };
			};

			it('should throw NotFoundException', async () => {
				setup('NoSuchKey');

				await expect(service.get(pathToFile)).rejects.toThrowError(NotFoundException);
			});

			it('should throw error', async () => {
				setup('Unknown Error');

				await expect(service.get(pathToFile)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('create', () => {
		const createFileAndPath = () => {
			const readable = Readable.from('ddd');
			const file = new FileDto({
				data: readable,
				name: 'test.txt',
				mimeType: 'text/plain',
			});
			const path = 'test/test.txt';

			return { file, path };
		};

		describe('WHEN file is created successfully', () => {
			const setup = () => {
				const { file, path } = createFileAndPath();

				client.config.endpoint = jest.fn().mockResolvedValueOnce({ protocol: '' });

				return { file, path };
			};

			it('should return data', async () => {
				const { file, path } = setup();

				const result = await service.create(path, file);

				expect(result).toBeDefined();
			});
		});

		describe('WHEN client throws Bad Request error', () => {
			const setup = () => {
				const { file, path } = createFileAndPath();
				const error = new Error('Bad Request');

				client.config.endpoint = jest.fn().mockResolvedValueOnce({ protocol: '' });
				jest.spyOn(Upload.prototype, 'done').mockRejectedValueOnce(error);

				return { file, path, error };
			};

			it('should throw error from client', async () => {
				const { file, path, error } = setup();

				await expect(service.create(path, file)).rejects.toThrow(error);
			});
		});

		describe('WHEN client throws NoSuchBucket error', () => {
			const setup = () => {
				const { file, path } = createFileAndPath();
				const error = { Code: 'NoSuchBucket' };

				client.config.endpoint = jest.fn().mockResolvedValueOnce({ protocol: '' });
				jest.spyOn(Upload.prototype, 'done').mockRejectedValueOnce(error);
				jest.spyOn(service, 'createBucket').mockResolvedValueOnce();
				const createSpy = jest.spyOn(service, 'create');

				return { file, path, error, createSpy };
			};

			it('should call createBucket() and itself', async () => {
				const { file, path, createSpy } = setup();

				await service.create(path, file);

				expect(service.createBucket).toBeCalled();
				expect(createSpy).toBeCalledTimes(2);
			});
		});
	});

	describe('moveToTrash', () => {
		it('should call send() of client with copy objects', async () => {
			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', CopySource: 'test-bucket/test/text.txt', Key: 'trash/test/text.txt' },
				})
			);
		});

		it('should call send() of client with delete objects', async () => {
			await service.moveToTrash([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});

		it('should return empty array on error with Code "NoSuchKey"', async () => {
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
		it('should call send() of client with delete objects', async () => {
			await service.delete([pathToFile]);

			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', Delete: { Objects: [{ Key: 'test/text.txt' }] } },
				})
			);
		});
	});

	describe('restore', () => {
		it('should call send() of client with copy objects', async () => {
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
		it('should call send() of client with copy objects', async () => {
			const pathsToCopy = [
				{
					sourcePath: 'trash/test/text.txt',
					targetPath: 'test/text.txt',
				},
			];

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
});
