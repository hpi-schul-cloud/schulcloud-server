import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordRepo } from '@shared/repo';
import { Request } from 'express';
import { FileRecord, FileRecordTargetType } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import * as path from 'path';
import { FileDownloadDto, FileMetaDto } from '../controller/dto/file.dto';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FilesStorageUC } from './files-storage.uc';
import { IGetFileResponse } from '../interface/storage-client';
import { IFile } from '../interface/file';

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let service: FilesStorageUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let request: Request;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let orm: MikroORM;
	let fileRecord: FileRecord;
	let fileDownloadParams: FileDownloadDto;
	let fileUploadParams: FileMetaDto;
	let response: IGetFileResponse;

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
		/* 	it('should call getFileRecord() of client', async () => {
			request.pipe = jest.fn().mockRejectedValue(false);
			await service.upload('123', fileUploadParams, request);
			expect(request.pipe).toHaveBeenCalledTimes(1);
			// console.log(r);
		}); */
	});

	describe('download()', () => {
		beforeEach(() => {
			fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
			storageClient.getFile.mockResolvedValue(response);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.download('123', fileDownloadParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('should call with fileRecordId', async () => {
				await service.download('123', fileDownloadParams);
				expect(fileRecordRepo.findOneById).toBeCalledWith(fileDownloadParams.fileRecordId);
			});

			it('should throw error if params with other filename', async () => {
				const paramsWithOtherFilename = { fileRecordId: '620abb23697023333eadea00', fileName: 'other-name.txt' };
				await expect(service.download('123', paramsWithOtherFilename)).rejects.toThrow();
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneById.mockRejectedValue(new Error());
				await expect(service.download('123', fileDownloadParams)).rejects.toThrow();
			});
		});

		describe('calls to storageClient.getFile()', () => {
			it('should call once', async () => {
				await service.download('123', fileDownloadParams);
				expect(storageClient.getFile).toHaveBeenCalledTimes(1);
			});

			it('should call with pathToFile', async () => {
				await service.download('123', fileDownloadParams);
				const pathToFile = path.join(fileRecord.schoolId, fileRecord.id, fileRecord.name);
				expect(storageClient.getFile).toBeCalledWith(pathToFile);
			});

			it('should return file response', async () => {
				const result = await service.download('123', fileDownloadParams);
				expect(result).toStrictEqual(response);
			});

			it('should throw error if entity not found', async () => {
				storageClient.getFile.mockRejectedValue(new Error());
				await expect(service.download('123', fileDownloadParams)).rejects.toThrow();
			});
		});
	});

	describe('getFileRecord()', () => {
		it('should return new FileRecord entity', () => {
			const file = createMock<IFile>({ size: 100, name: 'text.doc', type: 'text/text' });
			const result = service.getFileRecord('620abb23697023333eadea00', fileUploadParams, file);
			expect(result).toBeInstanceOf(FileRecord);
		});
	});
});
