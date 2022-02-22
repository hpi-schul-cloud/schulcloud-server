import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordRepo } from '@shared/repo';
import { Request } from 'express';
import { EntityId, FileRecord, FileRecordTargetType } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { Busboy } from 'busboy';
import { DownloadFileParams, UploadFileParams } from '../controller/dto/file-storage.params';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FilesStorageUC } from './files-storage.uc';
import { IGetFileResponse } from '../interface/storage-client';

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let service: FilesStorageUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let request: DeepMocked<Request>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let orm: MikroORM;
	let fileRecord: FileRecord;
	let fileDownloadParams: DownloadFileParams;
	let fileUploadParams: UploadFileParams;
	let response: IGetFileResponse;
	const userId: EntityId = '620abb23697023333eadea99';

	beforeAll(async () => {
		orm = await setupEntities();
		fileDownloadParams = { fileRecordId: '620abb23697023333eadea00', fileName: 'test.txt' };
		fileUploadParams = {
			schoolId: '620abb23697023333eadea00',
			targetId: '620abb23697023333eadea00',
			targetType: FileRecordTargetType.User,
		};

		fileRecord = fileRecordFactory.buildWithId({ name: 'test.txt' });
		response = createMock<IGetFileResponse>();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageUC);
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		request = createMock<Request>({
			headers: {
				connection: 'keep-alive',
				'content-length': '10699',
				'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20',
			},
		});
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('upload()', () => {
		const mockBusboyEvent = (requestStream: DeepMocked<Busboy>) => {
			requestStream.emit('file', 'file', Buffer.from('abc'), {
				filename: 'text.txt',
				encoding: '7-bit',
				mimeType: 'text/text',
			});
			return requestStream;
		};

		beforeEach(() => {
			request.get.mockReturnValue('1234');
			request.pipe.mockImplementation(mockBusboyEvent as never);

			fileRecordRepo.save.mockImplementation((entity: FileRecord) => {
				entity.id = '620abb23697023333eadea99';
				return Promise.resolve();
			});
		});

		it('should call request.get()', async () => {
			await service.upload(userId, fileUploadParams, request);
			expect(request.get).toBeCalledWith('content-length');
			expect(request.get).toHaveBeenCalledTimes(1);
		});

		it('should call request.pipe()', async () => {
			await service.upload(userId, fileUploadParams, request);
			expect(request.pipe).toHaveBeenCalledTimes(1);
		});

		it('should call fileRecordRepo.save', async () => {
			await service.upload(userId, fileUploadParams, request);
			expect(fileRecordRepo.save).toHaveBeenCalledTimes(1);
		});

		it('should call fileRecordRepo.uploadFile', async () => {
			await service.upload(userId, fileUploadParams, request);
			expect(storageClient.uploadFile).toHaveBeenCalledTimes(1);
		});

		it('should call fileRecordRepo.uploadFile with params', async () => {
			await service.upload(userId, fileUploadParams, request);

			// should be work without path join also for windows
			const storagePath = ['620abb23697023333eadea00', '620abb23697023333eadea99'].join('/');

			expect(storageClient.uploadFile).toBeCalledWith(storagePath, {
				buffer: Buffer.from('abc'),
				name: 'text.txt',
				size: 1234,
				type: 'text/text',
			});
		});

		it('should return instance of FileRecord', async () => {
			const result = await service.upload(userId, fileUploadParams, request);
			expect(result).toBeInstanceOf(FileRecord);
		});

		describe('Error Handling()', () => {
			beforeEach(() => {
				storageClient.uploadFile.mockRejectedValue(new Error());
			});

			it('should throw Error', async () => {
				await expect(service.upload(userId, fileUploadParams, request)).rejects.toThrow();
			});

			it('should call fileRecordRepo.removeAndFlush', async () => {
				await expect(service.upload(userId, fileUploadParams, request)).rejects.toThrow();

				expect(fileRecordRepo.delete).toBeCalledWith(
					expect.objectContaining({
						id: '620abb23697023333eadea99',
						name: 'text.txt',
						size: 1234,
						targetType: 'users',
						type: 'text/text',
						createdAt: expect.any(Date) as Date,
						updatedAt: expect.any(Date) as Date,
					})
				);
			});
		});
	});

	describe('download()', () => {
		beforeEach(() => {
			fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
			storageClient.getFile.mockResolvedValue(response);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.download(userId, fileDownloadParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('should call with fileRecordId', async () => {
				await service.download(userId, fileDownloadParams);
				expect(fileRecordRepo.findOneById).toBeCalledWith(fileDownloadParams.fileRecordId);
			});

			it('should throw error if params with other filename', async () => {
				const paramsWithOtherFilename = { fileRecordId: '620abb23697023333eadea00', fileName: 'other-name.txt' };
				await expect(service.download(userId, paramsWithOtherFilename)).rejects.toThrow();
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneById.mockRejectedValue(new Error());
				await expect(service.download(userId, fileDownloadParams)).rejects.toThrow();
			});
		});

		describe('calls to storageClient.getFile()', () => {
			it('should call once', async () => {
				await service.download(userId, fileDownloadParams);
				expect(storageClient.getFile).toHaveBeenCalledTimes(1);
			});

			it('should call with pathToFile', async () => {
				await service.download(userId, fileDownloadParams);
				const pathToFile = [fileRecord.schoolId, fileRecord.id].join('/');
				expect(storageClient.getFile).toBeCalledWith(pathToFile);
			});

			it('should return file response', async () => {
				const result = await service.download(userId, fileDownloadParams);
				expect(result).toStrictEqual(response);
			});

			it('should throw error if entity not found', async () => {
				storageClient.getFile.mockRejectedValue(new Error());
				await expect(service.download(userId, fileDownloadParams)).rejects.toThrow();
			});
		});
	});
});
