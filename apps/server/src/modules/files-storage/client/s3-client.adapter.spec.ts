import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3Config } from '../interface/config';
import { IFile } from '../interface/file';

const config = {
	endpoint: '',
	region: '',
	bucket: 'test-bucket',
	accessKeyId: '',
	secretAccessKey: '',
};

const pathToFile = 'test/text.txt';

describe('S3ClientAdapter', () => {
	let module: TestingModule;
	let service: S3ClientAdapter;
	let client: DeepMocked<S3Client>;

	beforeEach(async () => {
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

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createBucket', () => {
		it('should call send() of client', async () => {
			await service.createBucket();
			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: config.bucket },
				})
			);
		});

		it('should throw error from client', async () => {
			const e = new Error('Bad Request');
			client.send = jest.fn().mockRejectedValue(e);

			await expect(service.createBucket()).rejects.toThrow();
		});
	});

	describe('getFile', () => {
		it('should call send() of client', async () => {
			await service.get(pathToFile);
			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: config.bucket, Key: pathToFile },
				})
			);
		});

		it('should return file', async () => {
			const resultObj = {
				Body: 'data.Body as Readable',
				ContentType: 'data.ContentType',
				ContentLength: 'data.ContentLength',
				ETag: 'data.ETag',
			};

			client.send = jest.fn().mockResolvedValue(resultObj);
			const result = await service.get(pathToFile);

			expect(result).toStrictEqual({
				contentLength: 'data.ContentLength',
				contentType: 'data.ContentType',
				data: 'data.Body as Readable',
				etag: 'data.ETag',
			});
		});

		it('should throw error from client', async () => {
			const e = new Error('Bad Request');
			client.send = jest.fn().mockRejectedValue(e);

			await expect(service.get(pathToFile)).rejects.toThrow();
		});
	});

	describe('create', () => {
		const buffer = Buffer.from('ddd');
		const file: IFile = {
			buffer,
			name: 'test.txt',
			mimeType: 'text/plain',
			size: 100,
		};
		const path = 'test/test.txt';

		it('should call send() of client', async () => {
			await service.create(path, file);
			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: {
						Body: buffer,
						Bucket: 'test-bucket',
						ContentType: 'text/plain',
						Key: 'test/test.txt',
					},
				})
			);
		});

		it('should return data', async () => {
			client.send = jest.fn().mockResolvedValue(true);
			const result = await service.create(path, file);

			expect(result).toStrictEqual(true);
		});

		it('should throw error from client', async () => {
			const e = new Error('Bad Request');
			client.send = jest.fn().mockRejectedValue(e);

			await expect(service.create(path, file)).rejects.toThrow();
		});

		it('should call createBucket() if error from client error.Code === "NoSuchBucket" ', async () => {
			const e = { Code: 'NoSuchBucket' };
			client.send = jest.fn().mockRejectedValueOnce(e);
			service.createBucket = jest.fn();
			await service.create(path, file);
			expect(service.createBucket).toBeCalled();
		});

		it('should call itself if error from client error.Code === "NoSuchBucket" ', async () => {
			const e = { Code: 'NoSuchBucket' };
			client.send = jest.fn().mockRejectedValueOnce(e);
			const mock = jest.spyOn(service, 'create');
			await service.create(path, file);
			expect(mock).toBeCalledTimes(2);
		});
	});

	describe('delete', () => {
		it('should call send() of client with copy objects', async () => {
			await service.delete([pathToFile]);
			expect(client.send).toBeCalledWith(
				expect.objectContaining({
					input: { Bucket: 'test-bucket', CopySource: 'test-bucket/test/text.txt', Key: 'trash/test/text.txt' },
				})
			);
		});
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
	});
});
