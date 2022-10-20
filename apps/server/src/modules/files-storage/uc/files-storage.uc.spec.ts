import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Counted, EntityId, FileRecord, FileRecordParentType, Permission } from '@shared/domain';
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
import { CopyFileResponse } from '../controller/dto';
import { FileRecordParams, SingleFileParams } from '../controller/dto/file-storage.params';
import { ErrorType } from '../error';
import { PermissionContexts } from '../files-storage.const';
import { createFile } from '../helper';
import { IFile } from '../interface';
import { IGetFileResponse } from '../interface/storage-client';
import { FilesStorageMapper } from '../mapper/files-storage.mapper';
import { FilesStorageService } from '../service/files-storage.service';
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

const getFileRecordsWithParams = () => {
	const userId1 = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords1 = [
		fileRecordFactory.buildWithId({ parentId: userId1, schoolId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId1, schoolId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId1, schoolId, name: 'text-tree.txt' }),
	];

	const params1: FileRecordParams = {
		schoolId,
		parentId: userId1,
		parentType: FileRecordParentType.User,
	};

	return { params1, fileRecords1, userId1 };
};

const getFileRecordWithParams = () => {
	const userId1 = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecord1 = fileRecordFactory.buildWithId({ parentId: userId1, schoolId, name: 'text.txt' });

	const params1: SingleFileParams = {
		fileRecordId: fileRecord1.id,
	};

	return { params1, fileRecord1, userId1 };
};

const getRequest = () => {
	return createMock<Request>({
		headers: {
			connection: 'keep-alive',
			'content-length': '10699',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20',
		},
	});
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let httpService: DeepMocked<HttpService>;
	let orm: MikroORM;

	const getRequestParams = (schoolId1: EntityId, userId1: EntityId) => {
		return { schoolId: schoolId1, parentId: userId1, parentType: FileRecordParentType.User };
	};

	const getParams = () => {
		const userId1: EntityId = new ObjectId().toHexString();
		const schoolId1: EntityId = new ObjectId().toHexString();
		const requestParams1 = getRequestParams(schoolId1, userId1);

		return { userId1, schoolId1, requestParams1 };
	};

	const getTargetParams = () => {
		const targetParentId: EntityId = new ObjectId().toHexString();
		const schoolId1: EntityId = new ObjectId().toHexString();

		return {
			target: {
				schoolId: schoolId1,
				parentId: targetParentId,
				parentType: FileRecordParentType.Task,
			},
		};
	};

	beforeAll(async () => {
		orm = await setupEntities();
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
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
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

		filesStorageUC = module.get(FilesStorageUC);
		authorizationService = module.get(AuthorizationService);
		httpService = module.get(HttpService);
		fileRecordRepo = module.get(FileRecordRepo);
		filesStorageService = module.get(FilesStorageService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('uploadFromUrl is called', () => {
		const createAxiosResponse1 = <T = unknown>(data: T, headers: AxiosResponseHeaders = {}): AxiosResponse<T> => {
			return {
				data,
				status: 0,
				statusText: '',
				headers,
				config: {},
			};
		};

		const getUploadFromUrlParams = () => {
			const { params1, userId1, fileRecords1 } = getFileRecordsWithParams();
			const fileRecord1 = fileRecords1[0];

			const uploadFromUrlParams1 = {
				...params1,
				url: 'http://localhost/test.jpg',
				fileName: 'test.jpg',
				headers: {
					authorization: 'custom jwt',
				},
			};

			const headers = {
				connection: 'keep-alive',
				'content-length': '10699',
				'content-type': 'image/jpeg',
			};
			const buffer = Buffer.from('abc');
			const response = createAxiosResponse1(buffer, headers);

			return { fileRecord1, userId1, uploadFromUrlParams1, buffer, response };
		};

		describe('WHEN user is authorised, httpService gets response and file uploads successfully', () => {
			const setup = () => {
				const { fileRecord1, userId1, uploadFromUrlParams1, buffer, response } = getUploadFromUrlParams();

				httpService.get.mockReturnValueOnce(of(response));

				filesStorageService.uploadFile.mockResolvedValueOnce(fileRecord1);

				return { uploadFromUrlParams1, userId1, response, buffer, fileRecord1 };
			};

			it('should call authorizationService with correct params', async () => {
				const { uploadFromUrlParams1, userId1 } = setup();

				await filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId1,
					uploadFromUrlParams1.parentType,
					uploadFromUrlParams1.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call httpService get with correct params', async () => {
				const { uploadFromUrlParams1, userId1 } = setup();

				await filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1);

				const expectedConfig = {
					headers: uploadFromUrlParams1.headers,
					responseType: 'stream',
				};

				expect(httpService.get).toHaveBeenCalledWith(uploadFromUrlParams1.url, expectedConfig);
			});

			it('should call uploadFile get with correct params', async () => {
				const { uploadFromUrlParams1, userId1, response, buffer } = setup();

				await filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1);

				const expectedFileDescription = createFile(uploadFromUrlParams1.fileName, response, buffer);
				expect(filesStorageService.uploadFile).toHaveBeenCalledWith(
					userId1,
					uploadFromUrlParams1,
					expectedFileDescription
				);
			});

			it('should call uploadFile get with correct params', async () => {
				const { uploadFromUrlParams1, userId1, fileRecord1 } = setup();

				const result = await filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1);

				expect(result).toEqual(fileRecord1);
			});
		});

		describe('WHEN user is not authorised', () => {
			const setup = () => {
				const { userId1, uploadFromUrlParams1 } = getUploadFromUrlParams();
				const error = new Error('test');
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { uploadFromUrlParams1, userId1, error };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams1, userId1, error } = setup();

				await expect(filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1)).rejects.toThrow(error);
			});
		});

		describe('WHEN httpService throws error', () => {
			const setup = () => {
				const { userId1, uploadFromUrlParams1 } = getUploadFromUrlParams();

				const error = createObservable({
					isAxiosError: true,
					code: '404',
					response: {},
					name: 'errorText',
					message: 'errorText',
					toJSON: () => ({}),
				}) as never;
				httpService.get.mockResolvedValue(error);

				return { uploadFromUrlParams1, userId1 };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams1, userId1 } = setup();

				await expect(filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1)).rejects.toThrowError();
			});
		});

		describe('WHEN uploadFile throws error', () => {
			const setup = () => {
				const { userId1, uploadFromUrlParams1, response } = getUploadFromUrlParams();
				const error = new Error('test');

				httpService.get.mockReturnValueOnce(of(response));
				filesStorageService.uploadFile.mockRejectedValueOnce(error);

				return { uploadFromUrlParams1, userId1 };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams1, userId1 } = setup();

				const expectedError = new NotFoundException(ErrorType.FILE_NOT_FOUND);
				await expect(filesStorageUC.uploadFromUrl(userId1, uploadFromUrlParams1)).rejects.toThrow(expectedError);
			});
		});
	});

	describe('upload is called', () => {
		describe('WHEN user is authorized, busboy emits event and file is uploaded successfully', () => {
			const setup = () => {
				const { params1, userId1, fileRecords1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const request1 = getRequest();
				const buffer = Buffer.from('abc');
				const fileInfo = {
					filename: fileRecord1.name,
					encoding: '7-bit',
					mimeType: fileRecord1.mimeType,
				};

				const mockBusboyEvent = (requestStream: DeepMocked<Busboy>) => {
					requestStream.emit('file', 'file', buffer, fileInfo);
					return requestStream;
				};

				request1.pipe.mockImplementation(mockBusboyEvent as never);

				filesStorageService.uploadFile.mockResolvedValueOnce(fileRecord1);

				return { params1, userId1, request1, fileRecord1, buffer };
			};

			it('should call checkPermissionByReferences', async () => {
				const { params1, userId1, request1 } = setup();

				await filesStorageUC.upload(userId1, params1, request1);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params1.parentType);
				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId1,
					allowedType,
					params1.parentId,
					PermissionContexts.create
				);
			});

			it('should call uploadFile with correct params', async () => {
				const { params1, userId1, request1, buffer, fileRecord1 } = setup();

				await filesStorageUC.upload(userId1, params1, request1);

				const fileDescription: IFile = createFile(fileRecord1.name, request1, buffer);

				expect(filesStorageService.uploadFile).toHaveBeenCalledWith(userId1, params1, fileDescription);
			});

			it('should call uploadFile with correct params', async () => {
				const { params1, userId1, request1, fileRecord1 } = setup();

				const result = await filesStorageUC.upload(userId1, params1, request1);

				expect(result).toEqual(fileRecord1);
			});
		});

		describe('WHEN user is authorized and busboy emits error', () => {
			const setup = () => {
				const { params1, userId1 } = getFileRecordsWithParams();
				const request1 = getRequest();
				const error = new Error('test');

				const mockBusboyEvent = (requestStream: DeepMocked<Busboy>) => {
					requestStream.emit('error', error);

					return requestStream;
				};

				const size = request1.headers['content-length'];
				request1.get.mockReturnValue(size);
				request1.pipe.mockImplementation(mockBusboyEvent as never);

				return { params1, userId1, request1, error };
			};

			it('should pass error', async () => {
				const { params1, userId1, request1, error } = setup();

				const expectedError = new BadRequestException(error, `${FilesStorageUC.name}:upload requestStream`);

				await expect(filesStorageUC.upload(userId1, params1, request1)).rejects.toThrow(expectedError);
			});
		});

		describe('WHEN user is authorized, busboy emits event and storage client throws error', () => {
			const setup = () => {
				const { params1, userId1, fileRecords1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const request1 = getRequest();
				const buffer = Buffer.from('abc');

				const mockBusboyEvent = (requestStream: DeepMocked<Busboy>) => {
					requestStream.emit('file', 'file', buffer, {
						filename: fileRecord1.name,
						encoding: '7-bit',
						mimeType: fileRecord1.mimeType,
					});
					return requestStream;
				};

				const size = request1.headers['content-length'];
				request1.get.mockReturnValue(size);
				request1.pipe.mockImplementation(mockBusboyEvent as never);

				const error = new Error('test');
				filesStorageService.uploadFile.mockRejectedValueOnce(error);

				return { params1, userId1, request1, error };
			};

			it('should pass error', async () => {
				const { params1, userId1, request1, error } = setup();

				await expect(filesStorageUC.upload(userId1, params1, request1)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { params1, userId1 } = getFileRecordsWithParams();
				const request1 = getRequest();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { params1, userId1, request1, error };
			};

			it('should pass error', async () => {
				const { params1, userId1, request1, error } = setup();

				await expect(filesStorageUC.upload(userId1, params1, request1)).rejects.toThrowError(error);
			});
		});
	});

	describe('download is called', () => {
		describe('WHEN file is found and user is authorized', () => {
			const setup = () => {
				const { fileRecord1, params1, userId1 } = getFileRecordWithParams();
				const fileDownloadParams1 = { ...params1, fileName: fileRecord1.name };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);

				return { fileDownloadParams1, userId1, fileRecord1 };
			};

			it('should call getFile with correct params', async () => {
				const { fileDownloadParams1, userId1 } = setup();

				await filesStorageUC.download(userId1, fileDownloadParams1);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith({
					fileRecordId: fileDownloadParams1.fileRecordId,
				});
			});

			it('should call checkPermissionByReferences with correct params', async () => {
				const { fileDownloadParams1, userId1, fileRecord1 } = setup();

				await filesStorageUC.download(userId1, fileDownloadParams1);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord1.parentType);
				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId1,
					allowedType,
					fileRecord1.parentId,
					PermissionContexts.read
				);
			});
		});

		describe('WHEN getFile throws error', () => {
			const setup = () => {
				const { fileRecord1, params1, userId1 } = getFileRecordWithParams();
				const fileDownloadParams1 = { ...params1, fileName: fileRecord1.name };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { fileDownloadParams1, userId1, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams1, error, userId1 } = setup();

				await expect(filesStorageUC.download(userId1, fileDownloadParams1)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecord1, params1, userId1 } = getFileRecordWithParams();
				const fileDownloadParams1 = { ...params1, fileName: fileRecord1.name };
				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { fileDownloadParams1, userId1, fileRecord1 };
			};

			it('should throw Error', async () => {
				const { fileDownloadParams1, userId1 } = setup();

				await expect(filesStorageUC.download(userId1, fileDownloadParams1)).rejects.toThrow();
			});
		});

		describe('WHEN file is successfully downloaded', () => {
			const setup = () => {
				const { fileRecord1, params1, userId1 } = getFileRecordWithParams();
				const fileDownloadParams1 = { ...params1, fileName: fileRecord1.name };

				const fileResponse = createMock<IGetFileResponse>();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);
				filesStorageService.download.mockResolvedValueOnce(fileResponse);

				return { fileDownloadParams1, userId1, fileRecord1, fileResponse };
			};

			it('should call donwload with correct params', async () => {
				const { fileDownloadParams1, userId1, fileRecord1 } = setup();

				await filesStorageUC.download(userId1, fileDownloadParams1);

				expect(filesStorageService.download).toHaveBeenCalledWith(fileRecord1, fileDownloadParams1);
			});

			it('should return correct result', async () => {
				const { fileDownloadParams1, userId1, fileResponse } = setup();

				const result = await filesStorageUC.download(userId1, fileDownloadParams1);

				expect(result).toEqual(fileResponse);
			});
		});
	});

	describe('downloadBySecurityToken is called', () => {
		describe('WHEN file is found', () => {
			const setup = () => {
				const { fileRecord1 } = getFileRecordWithParams();
				const token = 'token';

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord1);

				return { fileRecord1, token };
			};

			it('should call getFile with correct params', async () => {
				const { token } = setup();

				await filesStorageUC.downloadBySecurityToken(token);

				expect(filesStorageService.getFileRecordBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});
		});

		describe('WHEN getFile throws error', () => {
			const setup = () => {
				const token = 'token';
				const error = new Error('test');

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockRejectedValueOnce(error);

				return { error, token };
			};

			it('should pass error', async () => {
				const { token, error } = setup();

				await expect(filesStorageUC.downloadBySecurityToken(token)).rejects.toThrow(error);

				expect(filesStorageService.getFileRecordBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});
		});

		describe('WHEN file is found', () => {
			const setup = () => {
				const { fileRecord1 } = getFileRecordWithParams();
				const token = 'token';
				const fileResponse = createMock<IGetFileResponse>();

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord1);
				filesStorageService.downloadFile.mockResolvedValueOnce(fileResponse);

				return { fileResponse, token, fileRecord1 };
			};

			it('should call downloadFile with correct params', async () => {
				const { token, fileRecord1 } = setup();

				await filesStorageUC.downloadBySecurityToken(token);

				expect(filesStorageService.downloadFile).toHaveBeenCalledWith(fileRecord1.schoolId, fileRecord1.id);
			});

			it('should return correct response', async () => {
				const { token, fileResponse } = setup();

				const result = await filesStorageUC.downloadBySecurityToken(token);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN downloadFile throws error', () => {
			const setup = () => {
				const { fileRecord1 } = getFileRecordWithParams();
				const token = 'token';
				const error = new Error('test');

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord1);
				filesStorageService.downloadFile.mockRejectedValueOnce(error);

				return { token, error };
			};

			it('should call downloadFile with correct params', async () => {
				const { token, error } = setup();

				await expect(filesStorageUC.downloadBySecurityToken(token)).rejects.toThrowError(error);
			});
		});
	});

	describe('deleteFilesOfParent is called', () => {
		describe('WHEN user is authorized', () => {
			const setup = () => {
				const { requestParams1, userId1 } = getParams();

				return { requestParams1, userId1 };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { userId1, requestParams1 } = getParams();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams1.parentType);

				await filesStorageUC.deleteFilesOfParent(userId1, requestParams1);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId1,
					allowedType,
					requestParams1.parentId,
					PermissionContexts.delete
				);
			});

			it('should call service with correct params', async () => {
				const { requestParams1, userId1 } = setup();

				await filesStorageUC.deleteFilesOfParent(userId1, requestParams1);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledWith(requestParams1);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { requestParams1, userId1 } = getParams();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams1, userId1 };
			};

			it('should throw forbidden error', async () => {
				const { requestParams1, userId1 } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId1, requestParams1)).rejects.toThrow(
					new ForbiddenException()
				);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service deletes successful', () => {
			const setup = () => {
				const { params1, userId1, fileRecords1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const mockedResult = [[fileRecord1], 0] as Counted<FileRecord[]>;

				filesStorageService.deleteFilesOfParent.mockResolvedValueOnce(mockedResult);

				return { params1, userId1, mockedResult };
			};

			it('should return results of service', async () => {
				const { params1, userId1, mockedResult } = setup();

				const result = await filesStorageUC.deleteFilesOfParent(userId1, params1);

				expect(result).toEqual(mockedResult);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { requestParams1, userId1 } = getParams();
				const error = new Error('test');

				filesStorageService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { requestParams1, userId1, error };
			};

			it('should return error of service', async () => {
				const { requestParams1, userId1, error } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId1, requestParams1)).rejects.toThrow(error);
			});
		});
	});

	describe('deleteOneFile is called', () => {
		describe('WHEN file is found', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const requestParams = { fileRecordId: fileRecord1.id };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);

				return { requestParams, userId1 };
			};

			it('should call getFile once', async () => {
				const { userId1, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId1, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledTimes(1);
			});

			it('should call getFile with correctly params', async () => {
				const { userId1, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId1, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(requestParams);
			});
		});

		describe('WHEN file is not found', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const requestParams = { fileRecordId: fileRecords1[0].id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { requestParams, userId1, error };
			};

			it('should throw error if entity not found', async () => {
				const { userId1, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId1, requestParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN user is authorized', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const requestParams = { fileRecordId: fileRecord1.id, parentType: fileRecord1.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);

				return { requestParams, userId1, fileRecord1 };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { requestParams, userId1, fileRecord1 } = setup();

				await filesStorageUC.deleteOneFile(userId1, requestParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId1,
					allowedType,
					fileRecord1.parentId,
					PermissionContexts.delete
				);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const requestParams = { fileRecordId: fileRecord1.id, parentType: fileRecord1.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams, userId1 };
			};

			it('should throw forbidden exception', async () => {
				const { requestParams, userId1 } = setup();

				await expect(filesStorageUC.deleteOneFile(userId1, requestParams)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.delete).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN delete was successful', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const requestParams = { fileRecordId: fileRecord1.id };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);

				return { requestParams, userId1, fileRecord1 };
			};

			it('should call delete with correct params', async () => {
				const { userId1, requestParams, fileRecord1 } = setup();

				await filesStorageUC.deleteOneFile(userId1, requestParams);

				expect(filesStorageService.delete).toHaveBeenCalledWith([fileRecord1]);
			});

			it('should return fileRecord', async () => {
				const { userId1, requestParams, fileRecord1 } = setup();

				const result = await filesStorageUC.deleteOneFile(userId1, requestParams);

				expect(result).toEqual(fileRecord1);
			});
		});

		describe('WHEN delete throws error', () => {
			const setup = () => {
				const { fileRecords1, userId1 } = getFileRecordsWithParams();
				const fileRecord1 = fileRecords1[0];
				const requestParams = { fileRecordId: fileRecord1.id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord1);
				filesStorageService.delete.mockRejectedValueOnce(error);

				return { requestParams, userId1, error };
			};

			it('should throw error', async () => {
				const { userId1, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId1, requestParams)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params1, userId1, fileRecords1 } = getFileRecordsWithParams();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restoreFilesOfParent.mockResolvedValueOnce([fileRecords1, fileRecords1.length]);

				return { params1, userId1, fileRecords1 };
			};

			it('should call authorisation with right parameters', async () => {
				const { params1, userId1 } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params1.parentType);

				await filesStorageUC.restoreFilesOfParent(userId1, params1);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId1,
					allowedType,
					params1.parentId,
					PermissionContexts.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params1, userId1 } = setup();

				await filesStorageUC.restoreFilesOfParent(userId1, params1);

				expect(filesStorageService.restoreFilesOfParent).toHaveBeenCalledWith(params1);
			});

			it('should return counted result', async () => {
				const { params1, userId1, fileRecords1 } = setup();

				const result = await filesStorageUC.restoreFilesOfParent(userId1, params1);

				expect(result).toEqual([fileRecords1, 3]);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params1, userId1 } = getFileRecordsWithParams();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params1, userId1 };
			};

			it('should throw forbidden error', async () => {
				const { params1, userId1 } = setup();
				await expect(filesStorageUC.restoreFilesOfParent(userId1, params1)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { params1, userId1 } = getFileRecordsWithParams();
				const error = new Error('test');

				filesStorageService.restoreFilesOfParent.mockRejectedValueOnce(error);

				return { params1, userId1, error };
			};

			it('should return error of service', async () => {
				const { params1, userId1, error } = setup();

				await expect(filesStorageUC.restoreFilesOfParent(userId1, params1)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreOneFile()', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params1, userId1, fileRecord1 } = getFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockResolvedValueOnce();

				return { params1, userId1, fileRecord1 };
			};

			it('should call filesStorageService.getMarkForDeletedFile with right parameters', async () => {
				const { params1, userId1 } = setup();

				await filesStorageUC.restoreOneFile(userId1, params1);

				expect(filesStorageService.getFileRecordMarkedForDelete).toHaveBeenCalledWith(params1);
			});

			it('should call authorisation with right parameters', async () => {
				const { params1, userId1, fileRecord1 } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord1.parentType);

				await filesStorageUC.restoreOneFile(userId1, params1);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId1,
					allowedType,
					fileRecord1.parentId,
					PermissionContexts.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params1, userId1, fileRecord1 } = setup();

				await filesStorageUC.restoreOneFile(userId1, params1);

				expect(filesStorageService.restore).toHaveBeenCalledWith([fileRecord1]);
			});

			it('should return counted result', async () => {
				const { params1, userId1, fileRecord1 } = setup();

				const result = await filesStorageUC.restoreOneFile(userId1, params1);

				expect(result).toEqual(fileRecord1);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params1, userId1, fileRecord1 } = getFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord1);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params1, userId1 };
			};

			it('should throw forbidden error', async () => {
				const { params1, userId1 } = setup();

				await expect(filesStorageUC.restoreOneFile(userId1, params1)).rejects.toThrow(new ForbiddenException());

				expect(filesStorageService.restore).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service getMarkForDeletedFile throws an error', () => {
			const setup = () => {
				const { params1, userId1 } = getFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockRejectedValueOnce(error);

				return { params1, userId1, error };
			};

			it('should return error of service', async () => {
				const { params1, userId1, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId1, params1)).rejects.toThrow(error);
			});
		});

		describe('WHEN service restore throws an error', () => {
			const setup = () => {
				const { params1, userId1, fileRecord1 } = getFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockRejectedValueOnce(error);

				return { params1, userId1, error };
			};

			it('should return error of service', async () => {
				const { params1, userId1, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId1, params1)).rejects.toThrow(error);
			});
		});
	});

	describe('copyFilesOfParent()', () => {
		describe('WHEN user has all permissions', () => {
			const setup = () => {
				const { requestParams1: sourceParams, userId1 } = getParams();
				const targetParams = getTargetParams();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { sourceParams, targetParams, userId1 };
			};

			it('should call authorizationService.checkPermissionByReferences by source params', async () => {
				const { sourceParams, targetParams, userId1 } = setup();

				await filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId1,
					sourceParams.parentType,
					sourceParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences by copyFilesParams', async () => {
				const { sourceParams, targetParams, userId1 } = setup();

				await filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId1,
					targetParams.target.parentType,
					targetParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { requestParams1: sourceParams, userId1 } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { sourceParams, targetParams, userId1, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId1, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { requestParams1: sourceParams, userId1 } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId1, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId1, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { requestParams1: sourceParams, userId1 } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId1, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId1, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service copies files successfully', () => {
			const setup = () => {
				const { params1: sourceParams, userId1, fileRecords1 } = getFileRecordsWithParams();
				const targetParams = getTargetParams();
				const sourceFile = fileRecords1[0];
				const targetFile = fileRecords1[1];

				const fileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockResolvedValueOnce([[fileResponse], 1]);

				return { sourceParams, targetParams, userId1, fileResponse };
			};

			it('should call service with correct params', async () => {
				const { sourceParams, targetParams, userId1 } = setup();

				await filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams);

				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledWith(userId1, sourceParams, targetParams);
			});

			it('should return copied files responses', async () => {
				const { sourceParams, targetParams, userId1, fileResponse } = setup();

				const result = await filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams);

				expect(result).toEqual([[fileResponse], 1]);
			});
		});

		describe('WHEN service copy throws error', () => {
			const setup = () => {
				const { params1: sourceParams, userId1 } = getFileRecordsWithParams();
				const targetParams = getTargetParams();

				const error = new Error('test');

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId1, error };
			};

			it('should pass error', async () => {
				const { sourceParams, targetParams, userId1, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId1, sourceParams, targetParams)).rejects.toThrow(error);
			});
		});
	});

	describe('copyOneFile()', () => {
		const getParamsForCopyOneFile = () => {
			const { userId1, fileRecords1 } = getFileRecordsWithParams();
			const targetParams = getTargetParams();
			const fileRecord1 = fileRecords1[0];

			const fileRecordId: EntityId = new ObjectId().toHexString();
			const singleFileParams = {
				fileRecordId,
			};
			const copyFileParams = { ...targetParams, fileNamePrefix: 'copy from' };

			return { singleFileParams, copyFileParams, userId1, fileRecord1 };
		};

		describe('WHEN user has all permissions', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId1, fileRecord1 };
			};

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId1, fileRecord1 } = setup();

				await filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId1,
					fileRecord1.parentType,
					fileRecord1.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences with copyFilesParams', async () => {
				const { copyFileParams, singleFileParams, userId1 } = setup();

				await filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId1,
					copyFileParams.target.parentType,
					copyFileParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId1, fileRecord1, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId1, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId1, fileRecord1, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId1, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId1, fileRecord1, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId1, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN source file is successfully found', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId1 };
			};

			it('should call findOneById with correct params', async () => {
				const { copyFileParams, singleFileParams, userId1 } = setup();

				await filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams);

				expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(singleFileParams.fileRecordId);
			});
		});

		describe('WHEN find source file throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();
				const error = new Error('test');

				fileRecordRepo.findOneById.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId1, fileRecord1, error };
			};

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId1, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams)).rejects.toThrow(error);

				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service copies files successfully', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				const fileResponse = new CopyFileResponse({
					id: fileRecord1.id,
					sourceId: singleFileParams.fileRecordId,
					name: fileRecord1.name,
				});

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockResolvedValueOnce([fileResponse]);

				return { singleFileParams, copyFileParams, userId1, fileResponse, fileRecord1 };
			};

			it('should call service with correct params', async () => {
				const { copyFileParams, singleFileParams, userId1, fileRecord1 } = setup();

				await filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams);

				expect(filesStorageService.copy).toHaveBeenCalledWith(userId1, [fileRecord1], copyFileParams.target);
			});

			it('should return copied files responses', async () => {
				const { copyFileParams, singleFileParams, userId1, fileResponse } = setup();

				const result = await filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId1, fileRecord1 } = getParamsForCopyOneFile();

				const error = new Error('test');

				fileRecordRepo.findOneById.mockResolvedValue(fileRecord1);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId1, fileRecord1, error };
			};

			it('should pass error', async () => {
				const { copyFileParams, singleFileParams, userId1, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId1, singleFileParams, copyFileParams)).rejects.toThrow(error);
			});
		});
	});
});
