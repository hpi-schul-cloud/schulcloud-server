import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, EntityId, FileRecord, FileRecordParentType, Permission, ScanStatus } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { FileRecordRepo } from '@shared/repo';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { AxiosResponse, AxiosResponseHeaders } from 'axios';
import { Busboy } from 'busboy';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import {
	CopyFileParams,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	FileUrlParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';
import { ErrorType } from '../files-storage.const';
import { IGetFileResponse } from '../interface/storage-client';
import { FilesStorageUC } from './files-storage.uc';

function createAxiosResponse<T = unknown>(data: T, headers: AxiosResponseHeaders = {}): AxiosResponse<T> {
	return {
		data,
		status: 0,
		statusText: '',
		headers,
		config: {},
	};
}

function createObservable<T = unknown>(data: T, headers: AxiosResponseHeaders = {}): Observable<AxiosResponse<T>> {
	return of(createAxiosResponse(data, headers));
}

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let service: FilesStorageUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let antivirusService: DeepMocked<AntivirusService>;
	let httpService: DeepMocked<HttpService>;
	let request: DeepMocked<Request>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let orm: MikroORM;
	let fileRecord: FileRecord;
	let fileRecords: FileRecord[];

	let fileDownloadParams: DownloadFileParams;
	let fileUploadParams: FileRecordParams;
	let uploadFromUrlParams: FileRecordParams & FileUrlParams;
	const url = 'http://localhost/test.jpg';
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
		uploadFromUrlParams = {
			...fileUploadParams,
			url,
			fileName: 'test.jpg',
			headers: {
				authorization: 'custom jwt',
			},
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageUC);
		authorizationService = module.get(AuthorizationService);
		antivirusService = module.get(AntivirusService);
		httpService = module.get(HttpService);
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

	describe('upload from link()', () => {
		beforeEach(() => {
			httpService.get.mockReturnValue(
				createObservable(
					{},
					{
						connection: 'keep-alive',
						'content-length': '10699',
						'content-type': 'image/jpeg',
					}
				)
			);
		});

		it('should call request.get()', async () => {
			await service.uploadFromUrl(userId, uploadFromUrlParams);

			expect(httpService.get).toBeCalledWith(url, {
				headers: { authorization: 'custom jwt' },
				responseType: 'stream',
			});
			expect(httpService.get).toHaveBeenCalledTimes(1);
		});

		it('should return instance of FileRecord', async () => {
			const result = await service.uploadFromUrl(userId, uploadFromUrlParams);
			expect(result).toBeInstanceOf(FileRecord);
			expect(result).toEqual(
				expect.objectContaining({
					createdAt: expect.any(Date) as Date,
					id: expect.any(String) as string,
					name: 'test.jpg',
					parentType: 'users',
					securityCheck: {
						createdAt: expect.any(Date) as Date,
						reason: 'not yet scanned',
						requestToken: expect.any(String) as string,
						status: 'pending',
						updatedAt: expect.any(Date) as Date,
					},
					size: 10699,
					updatedAt: expect.any(Date) as Date,
				})
			);
		});

		it('should throw Error', async () => {
			httpService.get.mockResolvedValue(
				createObservable({
					isAxiosError: true,
					code: '404',
					response: {},
					name: 'errorText',
					message: 'errorText',
					toJSON: () => ({}),
				}) as never
			);

			await expect(service.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow(NotFoundException);
		});

		describe('Tests of permission handling', () => {
			it('should call authorizationService.hasPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.uploadFromUrl(userId, uploadFromUrlParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileUploadParams.parentType,
					fileUploadParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow();
			});
		});
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.hasPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.upload(userId, fileUploadParams, request);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileUploadParams.parentType,
					fileUploadParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.upload(userId, fileUploadParams, request)).rejects.toThrow();
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

			describe('Error Handling', () => {
				it('should throw error if params with other filename', async () => {
					const paramsWithOtherFilename = { fileRecordId: schoolId, fileName: 'other-name.txt' };

					await expect(service.download(userId, paramsWithOtherFilename)).rejects.toThrowError(
						new NotFoundException(ErrorType.FILE_NOT_FOUND)
					);
				});

				it('should throw error if entity not found', async () => {
					fileRecordRepo.findOneById.mockRejectedValue(new Error());

					await expect(service.download(userId, fileDownloadParams)).rejects.toThrow();
				});

				it('should throw error if securityCheck.status === "blocked"', async () => {
					const blockedFileRecord = fileRecordFactory.buildWithId({ name: 'text.txt' });
					blockedFileRecord.securityCheck.status = ScanStatus.BLOCKED;
					fileRecordRepo.findOneById.mockResolvedValue(blockedFileRecord);

					await expect(service.download(userId, fileDownloadParams)).rejects.toThrowError(
						new NotAcceptableException(ErrorType.FILE_IS_BLOCKED)
					);
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.download(userId, fileDownloadParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Actions.read, requiredPermissions: [Permission.FILESTORAGE_VIEW] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.deleteFilesOfParent(userId, requestParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					requestParams.parentType,
					requestParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_REMOVE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.deleteFilesOfParent(userId, requestParams)).rejects.toThrow();
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.deleteOneFile(userId, requestParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_REMOVE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.deleteOneFile(userId, requestParams)).rejects.toThrow();
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.restoreFilesOfParent(userId, requestParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					requestParams.parentType,
					requestParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.restoreFilesOfParent(userId, requestParams)).rejects.toThrow();
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

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.restoreOneFile(userId, requestParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
				await expect(service.restoreOneFile(userId, requestParams)).rejects.toThrow();
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

		describe('copy with securityCheck and deletedSince', () => {
			it('should not call fileRecordRepo.save if just blocked', async () => {
				fileRecords = fileRecordFactory.buildList(1, { parentId: userId, schoolId });
				fileRecords[0].updateSecurityCheckStatus(ScanStatus.BLOCKED, 'virus');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 1]);
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});

			it('should not call fileRecordRepo.save if set deletedSince', async () => {
				fileRecords = fileRecordFactory.buildList(1, { parentId: userId, schoolId, deletedSince: new Date() });
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 1]);
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});

			it('should call fileRecordRepo.save for two entities [pended and verified]', async () => {
				fileRecords = fileRecordFactory.buildList(3, { parentId: userId, schoolId });
				fileRecords[0].updateSecurityCheckStatus(ScanStatus.BLOCKED, 'virus');
				fileRecords[1].updateSecurityCheckStatus(ScanStatus.VERIFIED, '');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 3]);
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);
			});

			it('should call storageClient.copy for two paths', async () => {
				fileRecords = fileRecordFactory.buildList(3, { parentId: userId, schoolId });
				fileRecords[0].updateSecurityCheckStatus(ScanStatus.BLOCKED, 'virus');
				fileRecords[1].updateSecurityCheckStatus(ScanStatus.VERIFIED, '');
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 3]);
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);

				expect(storageClient.copy).toHaveBeenCalledWith([
					{
						sourcePath: expect.any(String) as string,
						targetPath: expect.any(String) as string,
					},
					{
						sourcePath: expect.any(String) as string,
						targetPath: expect.any(String) as string,
					},
				]);
			});

			it('should call antivirusService.send for on entity with ScanStatus.PENDING', async () => {
				fileRecords = fileRecordFactory.buildList(1, { parentId: userId, schoolId });
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 1]);
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);

				expect(antivirusService.send).toHaveBeenCalledTimes(1);
			});
		});

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences by sourceParentParams', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					sourceParentParams.parentType,
					sourceParentParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences by copyFilesParams', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					copyFilesParams.target.parentType,
					copyFilesParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error if first check true', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				await expect(service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams)).rejects.toThrow();
			});

			it('should throw Error if second check true', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				await expect(service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams)).rejects.toThrow();
			});

			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				await expect(service.copyFilesOfParent(userId, sourceParentParams, copyFilesParams)).rejects.toThrow();
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

		describe('copy with securityCheck and deletedSince', () => {
			it('should not call fileRecordRepo.save if file has ScanStatus.BLOCKED', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId });
				fileRecord.updateSecurityCheckStatus(ScanStatus.BLOCKED, 'virus');
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);

				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});

			it('should not call fileRecordRepo.save if set deletedSince', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId, deletedSince: new Date() });
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
				await service.copyOneFile(userId, requestParams, copyFileParams);

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});

			it('should call fileRecordRepo.save for entity if file has ScanStatus.VERIFIED', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId });
				fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, '');
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(1);
			});

			it('should call fileRecordRepo.save for entity if file has ScanStatus.PENDING', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId });
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(1);
			});

			it('should call storageClient.copy', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId });
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
				await service.copyOneFile(userId, requestParams, copyFileParams);

				expect(storageClient.copy).toHaveBeenCalledWith([
					{
						sourcePath: expect.any(String) as string,
						targetPath: expect.any(String) as string,
					},
				]);
			});

			it('should call antivirusService.send for on entity if file has ScanStatus.PENDING', async () => {
				fileRecord = fileRecordFactory.build({ parentId: userId, schoolId });
				fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
				await service.copyOneFile(userId, requestParams, copyFileParams);

				expect(antivirusService.send).toHaveBeenCalledTimes(1);
			});
		});

		describe('Tests of permission handling', () => {
			it('should call authorizationService.checkPermissionByReferences', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences by copyFileParams', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				await service.copyOneFile(userId, requestParams, copyFileParams);
				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					copyFileParams.target.parentType,
					copyFileParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should throw Error if first check true', async () => {
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();
			});
			it('should throw Error if second check true', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();
			});
			it('should throw Error', async () => {
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				await expect(service.copyOneFile(userId, requestParams, copyFileParams)).rejects.toThrow();
			});
		});
	});
});
