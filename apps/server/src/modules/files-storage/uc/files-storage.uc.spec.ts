import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Busboy } from 'busboy';

import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecord, FileRecordParentType, ScanStatus } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';

import {
	DownloadFileParams,
	FileRecordParams,
	SingleFileParams,
	CopyFilesOfParentParams,
	CopyFileParams,
} from '../controller/dto/file-storage.params';
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
	let fileUploadParams: FileRecordParams;
	let response: IGetFileResponse;
	const entityId: EntityId = new ObjectId().toHexString();
	const userId: EntityId = new ObjectId().toHexString();
	const schoolId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		orm = await setupEntities();
		fileDownloadParams = { fileRecordId: schoolId, fileName: 'text.txt' };
		fileUploadParams = {
			schoolId,
			parentId: userId,
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
		fileRecords = [
			fileRecordFactory.build({ parentId: userId, schoolId, name: 'text.txt' }),
			fileRecordFactory.build({ parentId: userId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.build({ parentId: userId, schoolId, name: 'text-tree.txt' }),
		];
		fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);

		fileRecordRepo.save.mockImplementation((entity: FileRecord | FileRecord[]) => {
			(entity as FileRecord).id = entityId;
			return Promise.resolve();
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
				mimeType: 'text/plain',
			});
			return requestStream;
		};

		beforeEach(() => {
			request = createMock<Request>({
				headers: {
					connection: 'keep-alive',
					'content-length': '10699',
					'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20',
				},
			});

			request.get.mockReturnValue('1234');
			request.pipe.mockImplementation(mockBusboyEvent as never);
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

			const storagePath = [schoolId, entityId].join('/');

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

		describe('save() with FileName Handling', () => {
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
						id: entityId,
						name: 'text (1).txt',
						size: 1234,
						parentType: FileRecordParentType.User,
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
					const paramsWithOtherFilename = { fileRecordId: schoolId, fileName: 'other-name.txt' };
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

	describe('deleteFilesOfParent()', () => {
		let requestParams: FileRecordParams;
		beforeEach(() => {
			requestParams = {
				schoolId,
				parentId: userId,
				parentType: FileRecordParentType.User,
			};
			fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 1]);
			storageClient.delete.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findBySchoolIdAndParentId()', () => {
			it('should call once', async () => {
				await service.deleteFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.deleteFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(userId, requestParams)).rejects.toThrow();
			});
		});

		describe('calls to fileRecordRepo.save()', () => {
			it('should call with correctly params', async () => {
				await service.deleteFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecords);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.save.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(userId, requestParams)).rejects.toThrow();
			});

			it('should call two times if call delete throw an error', async () => {
				storageClient.delete.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(userId, requestParams)).rejects.toThrow();

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);
			});

			it('should return file response with deletedSince', async () => {
				const [fileRecordsRes] = await service.deleteFilesOfParent(userId, requestParams);
				expect(fileRecordsRes).toEqual(
					expect.arrayContaining([expect.objectContaining({ deletedSince: expect.any(Date) as Date })])
				);
			});
		});
	});

	describe('deleteOneFile()', () => {
		let requestParams: SingleFileParams;
		beforeEach(() => {
			requestParams = {
				fileRecordId: new ObjectId().toHexString(),
			};
			fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
			storageClient.delete.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.deleteOneFile(userId, requestParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.deleteOneFile(userId, requestParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(requestParams.fileRecordId);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneById.mockRejectedValue(new Error());
				await expect(service.deleteOneFile(userId, requestParams)).rejects.toThrow();
			});

			it('should return file response with deletedSince', async () => {
				const fileRecordRes = await service.deleteOneFile(userId, requestParams);
				expect(fileRecordRes).toEqual(expect.objectContaining({ deletedSince: expect.any(Date) as Date }));
			});
		});
	});

	describe('restoreFilesOfParent()', () => {
		let requestParams: FileRecordParams;
		beforeEach(() => {
			requestParams = {
				schoolId,
				parentId: userId,
				parentType: FileRecordParentType.User,
			};
			fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockResolvedValue([fileRecords, 1]);
			storageClient.delete.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete()', () => {
			it('should call once', async () => {
				await service.restoreFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.restoreFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreFilesOfParent(userId, requestParams)).rejects.toThrow();
			});
		});

		describe('calls to fileRecordRepo.save()', () => {
			it('should call with correctly params', async () => {
				await service.restoreFilesOfParent(userId, requestParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecords);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.save.mockRejectedValue(new Error());
				await expect(service.restoreFilesOfParent(userId, requestParams)).rejects.toThrow();
			});

			it('should call two times if call delete throw an error', async () => {
				storageClient.restore.mockRejectedValue(new Error());
				await expect(service.restoreFilesOfParent(userId, requestParams)).rejects.toThrow();

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);
			});

			it('should return file response with deletedSince is undefined', async () => {
				const [fileRecordsRes] = await service.restoreFilesOfParent(userId, requestParams);
				expect(fileRecordsRes).toEqual(expect.arrayContaining([expect.objectContaining({ deletedSince: undefined })]));
			});
		});
	});

	describe('restoreOneFile()', () => {
		let requestParams: SingleFileParams;
		beforeEach(() => {
			requestParams = {
				fileRecordId: new ObjectId().toHexString(),
			};
			fileRecordRepo.findOneByIdMarkedForDelete.mockResolvedValue(fileRecord);
			storageClient.restore.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.restoreOneFile(userId, requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.restoreOneFile(userId, requestParams);
				expect(fileRecordRepo.findOneByIdMarkedForDelete).toHaveBeenCalledWith(requestParams.fileRecordId);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneByIdMarkedForDelete.mockRejectedValue(new Error());
				await expect(service.restoreOneFile(userId, requestParams)).rejects.toThrow();
			});

			it('should return file response with deletedSince', async () => {
				const fileRecordRes = await service.restoreOneFile(userId, requestParams);
				expect(fileRecordRes).toEqual(expect.objectContaining({ deletedSince: undefined }));
			});
		});
	});

	describe('copyFilesOfParent()', () => {
		let sourceParentParams: FileRecordParams;
		let copyFilesParams: CopyFilesOfParentParams;
		const targetParentId: EntityId = new ObjectId().toHexString();

		beforeEach(() => {
			sourceParentParams = {
				schoolId,
				parentId: userId,
				parentType: FileRecordParentType.User,
			};
			copyFilesParams = {
				target: {
					schoolId,
					parentId: targetParentId,
					parentType: FileRecordParentType.Task,
				},
			};
			fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 1]);
			storageClient.copy.mockResolvedValue([]);
		});

		afterEach(() => {
			fileRecordRepo.save.mockRestore();
		});

		describe('calls to fileRecordRepo.findBySchoolIdAndParentId()', () => {
			it('should call once', async () => {
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledWith(
					sourceParentParams.schoolId,
					sourceParentParams.parentId
				);
			});

			it('should return empty response if entities not found', async () => {
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([[], 0]);

				const res = await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(res).toEqual([[], 0]);
			});
		});

		describe('calls to fileRecordRepo.save()', () => {
			it('should call with correctly params', async () => {
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({ parentType: FileRecordParentType.Task })
				);
			});

			it('should throw error if entity not saved', async () => {
				fileRecordRepo.save.mockRejectedValue(new Error());
				await expect(service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams)).rejects.toThrow();
			});

			it('should call fileRecordRepo.delete if call storageClient.copy throw an error', async () => {
				storageClient.copy.mockRejectedValue(new Error());
				await expect(service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams)).rejects.toThrow();

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(3);
				expect(fileRecordRepo.delete).toHaveBeenCalledTimes(1);
			});

			it('should return file response with parentType equal task', async () => {
				const [fileRecordsRes] = await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(fileRecordsRes).toEqual(
					expect.arrayContaining([expect.objectContaining({ parentType: FileRecordParentType.Task })])
				);
			});
		});
	});

	describe('copyOneFile()', () => {
		let requestParams: SingleFileParams;
		let copyFileParams: CopyFileParams;
		const targetParentId: EntityId = new ObjectId().toHexString();

		beforeEach(() => {
			requestParams = {
				fileRecordId: new ObjectId().toHexString(),
			};
			copyFileParams = {
				target: {
					schoolId,
					parentId: targetParentId,
					parentType: FileRecordParentType.Task,
				},
				fileNamePrefix: 'copy from',
			};
			fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
			storageClient.copy.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findOneById()', () => {
			it('should call once', async () => {
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(requestParams.fileRecordId);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findOneById.mockRejectedValue(new Error());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();
			});

			it('should return file response with parentType equal task', async () => {
				const fileRecordRes = await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRes).toEqual(expect.objectContaining({ parentType: FileRecordParentType.Task }));
			});

			it('should call fileRecordRepo.delete if call storageClient.copy throw an error', async () => {
				storageClient.copy.mockRejectedValue(new Error());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();

				expect(fileRecordRepo.delete).toHaveBeenCalledTimes(1);
			});
		});

		describe('calls to fileRecordRepo.save()', () => {
			it('should call with correctly params', async () => {
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({ parentType: FileRecordParentType.Task })
				);
			});

			it('should throw error if entity not saved', async () => {
				fileRecordRepo.save.mockRejectedValue(new Error());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();
			});

			it('should call fileRecordRepo.delete if call storageClient.copy throw an error', async () => {
				storageClient.copy.mockRejectedValue(new Error());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(1);
				expect(fileRecordRepo.delete).toHaveBeenCalledTimes(1);
			});

			it('should return file response with parentType equal task', async () => {
				const fileRecordsRes = await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordsRes).toEqual(expect.objectContaining({ parentType: FileRecordParentType.Task }));
			});
		});
	});
});
