import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Busboy } from 'busboy';

import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecord, FileRecordParentType, ScanStatus } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { DownloadFileParams, FileParams } from '../controller/dto/file-storage.params';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { IGetFileResponse } from '../interface/storage-client';

import { FilesStorageUC } from './files-storage.uc';

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let service: FilesStorageUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let request: DeepMocked<Request>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let orm: MikroORM;
	let fileRecord: FileRecord;
	let fileRecords: FileRecord[];

	let fileDownloadParams: DownloadFileParams;
	let fileUploadParams: FileParams;
	let response: IGetFileResponse;
	const userId: EntityId = '620abb23697023333eadea99';

	beforeAll(async () => {
		orm = await setupEntities();
		fileDownloadParams = { fileRecordId: '620abb23697023333eadea00', fileName: 'text.txt' };
		fileUploadParams = {
			schoolId: '620abb23697023333eadea00',
			parentId: '620abb23697023333eadea00',
			parentType: FileRecordParentType.User,
		};

		fileRecord = fileRecordFactory.buildWithId({ name: 'text.txt' });
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
				{
					provide: AntivirusService,
					useValue: createMock<AntivirusService>(),
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
		const { schoolId, parentId } = fileUploadParams;
		fileRecords = [
			fileRecordFactory.build({ parentId, schoolId, name: 'text.txt' }),
			fileRecordFactory.build({ parentId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.build({ parentId, schoolId, name: 'text-tree.txt' }),
		];
		fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);
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
				mimeType: 'text/plain',
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

		it('should call fileRecordRepo.uploadFile', async () => {
			await service.upload(userId, fileUploadParams, request);
			expect(storageClient.create).toHaveBeenCalledTimes(1);
		});

		it('should call fileRecordRepo.uploadFile with params', async () => {
			await service.upload(userId, fileUploadParams, request);

			const storagePath = ['620abb23697023333eadea00', '620abb23697023333eadea99'].join('/');

			expect(storageClient.create).toBeCalledWith(storagePath, {
				buffer: Buffer.from('abc'),
				name: 'text.txt',
				size: 1234,
				mimeType: 'text/plain',
			});
		});

		it('should return instance of FileRecord', async () => {
			const result = await service.upload(userId, fileUploadParams, request);
			expect(result).toBeInstanceOf(FileRecord);
		});

		describe('save() with FileName Habdling', () => {
			it('should call fileRecordRepo.save', async () => {
				await service.upload(userId, fileUploadParams, request);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(1);
			});

			it('should return filename with increment (1)', async () => {
				const result = await service.upload(userId, fileUploadParams, request);
				expect(result.name).toStrictEqual('text (1).txt');
			});

			it('should return filename with increment (2)', async () => {
				fileRecords[1].name = 'text (1).txt';

				const result = await service.upload(userId, fileUploadParams, request);
				expect(result.name).toStrictEqual('text (2).txt');
			});

			it('should return filename with increment (1) but filename and filename (2) exists', async () => {
				fileRecords[2].name = 'text (2).txt';

				const result = await service.upload(userId, fileUploadParams, request);
				expect(result.name).toStrictEqual('text (1).txt');
			});
		});

		describe('Error Handling()', () => {
			beforeEach(() => {
				storageClient.create.mockRejectedValue(new Error());
			});

			it('should throw Error', async () => {
				await expect(service.upload(userId, fileUploadParams, request)).rejects.toThrow();
			});

			it('should call fileRecordRepo.removeAndFlush', async () => {
				await expect(service.upload(userId, fileUploadParams, request)).rejects.toThrow();

				expect(fileRecordRepo.delete).toBeCalledWith(
					expect.objectContaining({
						id: '620abb23697023333eadea99',
						name: 'text (1).txt',
						size: 1234,
						parentType: 'users',
						mimeType: 'text/plain',
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
			storageClient.get.mockResolvedValue(response);
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
			describe('Error Handling()', () => {
				it('should throw error if params with other filename', async () => {
					const paramsWithOtherFilename = { fileRecordId: '620abb23697023333eadea00', fileName: 'other-name.txt' };
					await expect(service.download(userId, paramsWithOtherFilename)).rejects.toThrow('File not found');
				});

				it('should throw error if entity not found', async () => {
					fileRecordRepo.findOneById.mockRejectedValue(new Error());
					await expect(service.download(userId, fileDownloadParams)).rejects.toThrow();
				});

				it('should throw error if securityCheck.status === "blocked"', async () => {
					const blockedFileRecord = fileRecordFactory.buildWithId({ name: 'text.txt' });
					blockedFileRecord.securityCheck.status = ScanStatus.BLOCKED;
					fileRecordRepo.findOneById.mockResolvedValue(blockedFileRecord);
					await expect(service.download(userId, fileDownloadParams)).rejects.toThrow('File is blocked');
				});
			});
		});

		describe('calls to storageClient.getFile()', () => {
			it('should call once', async () => {
				await service.download(userId, fileDownloadParams);
				expect(storageClient.get).toHaveBeenCalledTimes(1);
			});

			it('should call with pathToFile', async () => {
				await service.download(userId, fileDownloadParams);
				const pathToFile = [fileRecord.schoolId, fileRecord.id].join('/');
				expect(storageClient.get).toBeCalledWith(pathToFile);
			});

			it('should return file response', async () => {
				const result = await service.download(userId, fileDownloadParams);
				expect(result).toStrictEqual(response);
			});

			it('should throw error if entity not found', async () => {
				storageClient.get.mockRejectedValue(new Error());
				await expect(service.download(userId, fileDownloadParams)).rejects.toThrow();
			});
		});
	});

	describe('downloadBySecurityToken()', () => {
		let token: string;
		beforeEach(() => {
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			storageClient.get.mockResolvedValue(response);
			token = fileRecord.securityCheck.requestToken || '';
		});

		describe('calls to fileRecordRepo.findBySecurityCheckRequestToken()', () => {
			it('should return file response', async () => {
				const result = await service.downloadBySecurityToken(token);
				expect(result).toStrictEqual(response);
			});

			it('should call once', async () => {
				await service.downloadBySecurityToken(token);
				expect(fileRecordRepo.findBySecurityCheckRequestToken).toHaveBeenCalledTimes(1);
			});

			it('should call with params', async () => {
				await service.downloadBySecurityToken(token);
				expect(fileRecordRepo.findBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findBySecurityCheckRequestToken.mockRejectedValue(new Error());
				await expect(service.downloadBySecurityToken(token)).rejects.toThrow();
			});
		});
	});
});
