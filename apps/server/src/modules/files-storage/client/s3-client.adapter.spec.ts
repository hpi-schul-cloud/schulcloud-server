import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
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

const pathToFile = '/test/text.txt';

describe('S3ClientAdapter', () => {
	let module: TestingModule;
	let service: S3ClientAdapter;
	let client: S3Client;
	let logger: Logger;

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
			await service.getFile(pathToFile);
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
			const result = await service.getFile(pathToFile);

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

			await expect(service.getFile(pathToFile)).rejects.toThrow();
		});
	});

	describe('uploadFile', () => {
		const buffer = Buffer.from('ddd');
		const file: IFile = {
			buffer,
			name: 'test.txt',
			mimeType: 'text/plain',
			size: 100,
		};
		const path = 'test/test.txt';

		it('should call send() of client', async () => {
			await service.uploadFile(path, file);
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
			const result = await service.uploadFile(path, file);

			expect(result).toStrictEqual(true);
		});

		it('should throw error from client', async () => {
			const e = new Error('Bad Request');
			client.send = jest.fn().mockRejectedValue(e);

			await expect(service.uploadFile(path, file)).rejects.toThrow();
		});

		it('should call createBucket() if error from client error.Code === "NoSuchBucket" ', async () => {
			const e = { Code: 'NoSuchBucket' };
			client.send = jest.fn().mockRejectedValueOnce(e);
			service.createBucket = jest.fn();
			await service.uploadFile(path, file);
			expect(service.createBucket).toBeCalled();
		});

		it('should call itself if error from client error.Code === "NoSuchBucket" ', async () => {
			const e = { Code: 'NoSuchBucket' };
			client.send = jest.fn().mockRejectedValueOnce(e);
			const mock = jest.spyOn(service, 'uploadFile');
			await service.uploadFile(path, file);
			expect(mock).toBeCalledTimes(2);
		});
	});
});
