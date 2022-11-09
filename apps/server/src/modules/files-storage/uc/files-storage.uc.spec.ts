import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Counted, EntityId, FileRecord, FileRecordParentType, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from 'axios';
import { Request } from 'express';
import { of } from 'rxjs';
import { Readable } from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { CopyFileResponse, FileRecordParams, SingleFileParams } from '../controller/dto';
import { ErrorType } from '../error';
import { PermissionContexts } from '../files-storage.const';
import { IFile } from '../interface';
import { IGetFileResponse } from '../interface/storage-client';
import { FilesStorageMapper, IFileBuilder } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { FilesStorageUC } from './files-storage.uc';

const createAxiosResponse = (data: Readable, headers: AxiosResponseHeaders = {}): AxiosResponse<Readable> => {
	const response: AxiosResponse<Readable> = {
		data,
		status: 0,
		statusText: '',
		headers,
		config: {},
	};

	return response;
};

const getFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const getFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
};

const getRequest = () => {
	const request: DeepMocked<Request> = createMock<Request>({
		headers: {
			connection: 'keep-alive',
			'content-length': '10699',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20',
		},
		get: () => {
			return `10699`;
		},
	});

	return request;
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let httpService: DeepMocked<HttpService>;
	let orm: MikroORM;

	const getRequestParams = (schoolId: EntityId, userId: EntityId) => {
		return { schoolId, parentId: userId, parentType: FileRecordParentType.User };
	};

	const getParams = () => {
		const userId: EntityId = new ObjectId().toHexString();
		const schoolId: EntityId = new ObjectId().toHexString();
		const requestParams = getRequestParams(schoolId, userId);

		return { userId, schoolId, requestParams };
	};

	const getTargetParams = () => {
		const targetParentId: EntityId = new ObjectId().toHexString();
		const schoolId: EntityId = new ObjectId().toHexString();

		return {
			target: {
				schoolId,
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
		filesStorageService = module.get(FilesStorageService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('uploadFromUrl is called', () => {
		const getUploadFromUrlParams = () => {
			const { params, userId, fileRecords } = getFileRecordsWithParams();
			const fileRecord = fileRecords[0];

			const uploadFromUrlParams = {
				...params,
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
			const readable = Readable.from('abc');
			const response = createAxiosResponse(readable, headers);

			return { fileRecord, userId, uploadFromUrlParams, response };
		};

		describe('WHEN user is authorised, httpService gets response and file uploads successfully', () => {
			const setup = () => {
				const { fileRecord, userId, uploadFromUrlParams, response } = getUploadFromUrlParams();

				httpService.get.mockReturnValueOnce(of(response));

				filesStorageService.uploadFile.mockResolvedValueOnce(fileRecord);

				return { uploadFromUrlParams, userId, response, fileRecord };
			};

			it('should call authorizationService with correct params', async () => {
				const { uploadFromUrlParams, userId } = setup();

				await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					uploadFromUrlParams.parentType,
					uploadFromUrlParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call httpService get with correct params', async () => {
				const { uploadFromUrlParams, userId } = setup();

				await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				const expectedConfig: AxiosRequestConfig = {
					headers: uploadFromUrlParams.headers,
					responseType: 'stream',
				};

				expect(httpService.get).toHaveBeenCalledWith(uploadFromUrlParams.url, expectedConfig);
			});

			it('should call uploadFile get with correct params', async () => {
				const { uploadFromUrlParams, userId, response } = setup();

				await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				const expectedFileDescription = IFileBuilder.buildFromAxiosResponse(uploadFromUrlParams.fileName, response);
				expect(filesStorageService.uploadFile).toHaveBeenCalledWith(
					userId,
					uploadFromUrlParams,
					expectedFileDescription
				);
			});

			it('should call uploadFile get with correct params', async () => {
				const { uploadFromUrlParams, userId, fileRecord } = setup();

				const result = await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is not authorised', () => {
			const setup = () => {
				const { userId, uploadFromUrlParams } = getUploadFromUrlParams();
				const error = new Error('test');
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { uploadFromUrlParams, userId, error };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams, userId, error } = setup();

				await expect(filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN httpService throws error', () => {
			const setup = () => {
				const { userId, uploadFromUrlParams } = getUploadFromUrlParams();

				const headers: AxiosResponseHeaders = {};
				const config: AxiosRequestConfig = {};
				const errorResponse: AxiosResponse = {
					data: {},
					status: 404,
					statusText: 'errorText',
					headers,
					config,
					request: {},
				};

				httpService.get.mockImplementation(() => {
					const observable = of(errorResponse);
					return observable;
				});

				return { uploadFromUrlParams, userId };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams, userId } = setup();
				const error = new NotFoundException(ErrorType.FILE_NOT_FOUND);

				await expect(filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrowError(error);
			});
		});

		describe('WHEN uploadFile throws error', () => {
			const setup = () => {
				const { userId, uploadFromUrlParams, response } = getUploadFromUrlParams();
				const error = new Error('test');

				httpService.get.mockReturnValueOnce(of(response));
				filesStorageService.uploadFile.mockRejectedValueOnce(error);

				return { uploadFromUrlParams, userId };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams, userId } = setup();

				const expectedError = new NotFoundException(ErrorType.FILE_NOT_FOUND);
				await expect(filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow(expectedError);
			});
		});
	});

	describe('upload is called', () => {
		describe('WHEN user is authorized, busboy emits event and file is uploaded successfully', () => {
			const setup = () => {
				const { params, userId, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const request = getRequest();
				const readable = Readable.from('abc');
				const fileInfo = {
					filename: fileRecord.name,
					encoding: '7-bit',
					mimeType: fileRecord.mimeType,
				};

				request.pipe.mockImplementation((requestStream) => {
					requestStream.emit('file', 'file', readable, fileInfo);
					return requestStream;
				});

				filesStorageService.uploadFile.mockResolvedValueOnce(fileRecord);

				return { params, userId, request, fileRecord, buffer: readable, fileInfo };
			};

			it('should call checkPermissionByReferences', async () => {
				const { params, userId, request } = setup();

				await filesStorageUC.upload(userId, params, request);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);
				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					params.parentId,
					PermissionContexts.create
				);
			});

			it('should call uploadFile with correct params', async () => {
				const { params, userId, request, buffer, fileInfo } = setup();

				await filesStorageUC.upload(userId, params, request);

				const fileDescription: IFile = IFileBuilder.buildFromRequest(fileInfo, request, buffer);

				expect(filesStorageService.uploadFile).toHaveBeenCalledWith(userId, params, fileDescription);
			});

			it('should call uploadFile with correct params', async () => {
				const { params, userId, request, fileRecord } = setup();

				const result = await filesStorageUC.upload(userId, params, request);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is authorized and busboy emits error', () => {
			const setup = () => {
				const { params, userId } = getFileRecordsWithParams();
				const request = getRequest();
				const error = new Error('test');

				const size = request.headers['content-length'];

				request.get.mockReturnValue(size);
				request.pipe.mockImplementation((requestStream) => {
					requestStream.emit('error', error);

					return requestStream;
				});

				return { params, userId, request, error };
			};

			it('should pass error', async () => {
				const { params, userId, request, error } = setup();

				const expectedError = new BadRequestException(error, `${FilesStorageUC.name}:upload requestStream`);

				await expect(filesStorageUC.upload(userId, params, request)).rejects.toThrow(expectedError);
			});
		});

		describe('WHEN user is authorized, busboy emits event and storage client throws error', () => {
			const setup = () => {
				const { params, userId, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const request = getRequest();
				const buffer = Buffer.from('abc');

				const size = request.headers['content-length'];

				request.get.mockReturnValue(size);
				request.pipe.mockImplementation((requestStream) => {
					requestStream.emit('file', 'file', buffer, {
						filename: fileRecord.name,
						encoding: '7-bit',
						mimeType: fileRecord.mimeType,
					});

					return requestStream;
				});

				const error = new Error('test');
				filesStorageService.uploadFile.mockRejectedValueOnce(error);

				return { params, userId, request, error };
			};

			it('should pass error', async () => {
				const { params, userId, request, error } = setup();

				await expect(filesStorageUC.upload(userId, params, request)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { params, userId } = getFileRecordsWithParams();
				const request = getRequest();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { params, userId, request, error };
			};

			it('should pass error', async () => {
				const { params, userId, request, error } = setup();

				await expect(filesStorageUC.upload(userId, params, request)).rejects.toThrowError(error);
			});
		});
	});

	describe('download is called', () => {
		describe('WHEN file is found and user is authorized', () => {
			const setup = () => {
				const { fileRecord, params, userId } = getFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				return { fileDownloadParams, userId, fileRecord };
			};

			it('should call getFile with correct params', async () => {
				const { fileDownloadParams, userId } = setup();

				await filesStorageUC.download(userId, fileDownloadParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith({
					fileRecordId: fileDownloadParams.fileRecordId,
				});
			});

			it('should call checkPermissionByReferences with correct params', async () => {
				const { fileDownloadParams, userId, fileRecord } = setup();

				await filesStorageUC.download(userId, fileDownloadParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord.parentType);
				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					PermissionContexts.read
				);
			});
		});

		describe('WHEN getFile throws error', () => {
			const setup = () => {
				const { fileRecord, params, userId } = getFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { fileDownloadParams, userId, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, error, userId } = setup();

				await expect(filesStorageUC.download(userId, fileDownloadParams)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecord, params, userId } = getFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };
				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error);

				return { fileDownloadParams, userId, fileRecord };
			};

			it('should throw Error', async () => {
				const { fileDownloadParams, userId } = setup();

				await expect(filesStorageUC.download(userId, fileDownloadParams)).rejects.toThrow();
			});
		});

		describe('WHEN file is successfully downloaded', () => {
			const setup = () => {
				const { fileRecord, params, userId } = getFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };

				const fileResponse = createMock<IGetFileResponse>();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				filesStorageService.download.mockResolvedValueOnce(fileResponse);

				return { fileDownloadParams, userId, fileRecord, fileResponse };
			};

			it('should call donwload with correct params', async () => {
				const { fileDownloadParams, userId, fileRecord } = setup();

				await filesStorageUC.download(userId, fileDownloadParams);

				expect(filesStorageService.download).toHaveBeenCalledWith(fileRecord, fileDownloadParams);
			});

			it('should return correct result', async () => {
				const { fileDownloadParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.download(userId, fileDownloadParams);

				expect(result).toEqual(fileResponse);
			});
		});
	});

	describe('downloadBySecurityToken is called', () => {
		describe('WHEN file is found', () => {
			const setup = () => {
				const { fileRecord } = getFileRecordWithParams();
				const token = 'token';

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);

				return { fileRecord, token };
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
				const { fileRecord } = getFileRecordWithParams();
				const token = 'token';
				const fileResponse = createMock<IGetFileResponse>();

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				filesStorageService.downloadFile.mockResolvedValueOnce(fileResponse);

				return { fileResponse, token, fileRecord };
			};

			it('should call downloadFile with correct params', async () => {
				const { token, fileRecord } = setup();

				await filesStorageUC.downloadBySecurityToken(token);

				expect(filesStorageService.downloadFile).toHaveBeenCalledWith(fileRecord.schoolId, fileRecord.id);
			});

			it('should return correct response', async () => {
				const { token, fileResponse } = setup();

				const result = await filesStorageUC.downloadBySecurityToken(token);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN downloadFile throws error', () => {
			const setup = () => {
				const { fileRecord } = getFileRecordWithParams();
				const token = 'token';
				const error = new Error('test');

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
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
				const { requestParams, userId } = getParams();

				return { requestParams, userId };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { userId, requestParams } = getParams();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					requestParams.parentId,
					PermissionContexts.delete
				);
			});

			it('should call service with correct params', async () => {
				const { requestParams, userId } = setup();

				await filesStorageUC.deleteFilesOfParent(userId, requestParams);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledWith(requestParams);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { requestParams, userId } = getParams();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams, userId };
			};

			it('should throw forbidden error', async () => {
				const { requestParams, userId } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId, requestParams)).rejects.toThrow(
					new ForbiddenException()
				);

				expect(filesStorageService.deleteFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service deletes successful', () => {
			const setup = () => {
				const { params, userId, fileRecords } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const mockedResult = [[fileRecord], 0] as Counted<FileRecord[]>;

				filesStorageService.deleteFilesOfParent.mockResolvedValueOnce(mockedResult);

				return { params, userId, mockedResult };
			};

			it('should return results of service', async () => {
				const { params, userId, mockedResult } = setup();

				const result = await filesStorageUC.deleteFilesOfParent(userId, params);

				expect(result).toEqual(mockedResult);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { requestParams, userId } = getParams();
				const error = new Error('test');

				filesStorageService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should return error of service', async () => {
				const { requestParams, userId, error } = setup();

				await expect(filesStorageUC.deleteFilesOfParent(userId, requestParams)).rejects.toThrow(error);
			});
		});
	});

	describe('deleteOneFile is called', () => {
		describe('WHEN file is found', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				return { requestParams, userId };
			};

			it('should call getFile once', async () => {
				const { userId, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledTimes(1);
			});

			it('should call getFile with correctly params', async () => {
				const { userId, requestParams } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(requestParams);
			});
		});

		describe('WHEN file is not found', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const requestParams = { fileRecordId: fileRecords[0].id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should throw error if entity not found', async () => {
				const { userId, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN user is authorized', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id, parentType: fileRecord.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				return { requestParams, userId, fileRecord };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { requestParams, userId, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(requestParams.parentType);

				expect(authorizationService.checkPermissionByReferences).toBeCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					PermissionContexts.delete
				);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id, parentType: fileRecord.parentType };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { requestParams, userId };
			};

			it('should throw forbidden exception', async () => {
				const { requestParams, userId } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.delete).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN delete was successful', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);

				return { requestParams, userId, fileRecord };
			};

			it('should call delete with correct params', async () => {
				const { userId, requestParams, fileRecord } = setup();

				await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(filesStorageService.delete).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return fileRecord', async () => {
				const { userId, requestParams, fileRecord } = setup();

				const result = await filesStorageUC.deleteOneFile(userId, requestParams);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN delete throws error', () => {
			const setup = () => {
				const { fileRecords, userId } = getFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const requestParams = { fileRecordId: fileRecord.id };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				filesStorageService.delete.mockRejectedValueOnce(error);

				return { requestParams, userId, error };
			};

			it('should throw error', async () => {
				const { userId, requestParams, error } = setup();

				await expect(filesStorageUC.deleteOneFile(userId, requestParams)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreFilesOfParent is called', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params, userId, fileRecords } = getFileRecordsWithParams();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restoreFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);

				return { params, userId, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { params, userId } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);

				await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					params.parentId,
					PermissionContexts.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params, userId } = setup();

				await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(filesStorageService.restoreFilesOfParent).toHaveBeenCalledWith(params);
			});

			it('should return counted result', async () => {
				const { params, userId, fileRecords } = setup();

				const result = await filesStorageUC.restoreFilesOfParent(userId, params);

				expect(result).toEqual([fileRecords, 3]);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params, userId } = getFileRecordsWithParams();
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params, userId };
			};

			it('should throw forbidden error', async () => {
				const { params, userId } = setup();
				await expect(filesStorageUC.restoreFilesOfParent(userId, params)).rejects.toThrow(new ForbiddenException());
				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { params, userId } = getFileRecordsWithParams();
				const error = new Error('test');

				filesStorageService.restoreFilesOfParent.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreFilesOfParent(userId, params)).rejects.toThrow(error);
			});
		});
	});

	describe('restoreOneFile()', () => {
		describe('WHEN user is authorised', () => {
			const setup = () => {
				const { params, userId, fileRecord } = getFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockResolvedValueOnce();

				return { params, userId, fileRecord };
			};

			it('should call filesStorageService.getMarkForDeletedFile with right parameters', async () => {
				const { params, userId } = setup();

				await filesStorageUC.restoreOneFile(userId, params);

				expect(filesStorageService.getFileRecordMarkedForDelete).toHaveBeenCalledWith(params);
			});

			it('should call authorisation with right parameters', async () => {
				const { params, userId, fileRecord } = setup();
				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(fileRecord.parentType);

				await filesStorageUC.restoreOneFile(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					allowedType,
					fileRecord.parentId,
					PermissionContexts.create
				);
			});

			it('should call filesStorageService with right parameters', async () => {
				const { params, userId, fileRecord } = setup();

				await filesStorageUC.restoreOneFile(userId, params);

				expect(filesStorageService.restore).toHaveBeenCalledWith([fileRecord]);
			});

			it('should return counted result', async () => {
				const { params, userId, fileRecord } = setup();

				const result = await filesStorageUC.restoreOneFile(userId, params);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is not authorised ', () => {
			const setup = () => {
				const { params, userId, fileRecord } = getFileRecordWithParams();

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { params, userId };
			};

			it('should throw forbidden error', async () => {
				const { params, userId } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(new ForbiddenException());

				expect(filesStorageService.restore).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service getMarkForDeletedFile throws an error', () => {
			const setup = () => {
				const { params, userId } = getFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(error);
			});
		});

		describe('WHEN service restore throws an error', () => {
			const setup = () => {
				const { params, userId, fileRecord } = getFileRecordWithParams();
				const error = new Error('test');

				filesStorageService.getFileRecordMarkedForDelete.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.restore.mockRejectedValueOnce(error);

				return { params, userId, error };
			};

			it('should return error of service', async () => {
				const { params, userId, error } = setup();

				await expect(filesStorageUC.restoreOneFile(userId, params)).rejects.toThrow(error);
			});
		});
	});

	describe('copyFilesOfParent()', () => {
		describe('WHEN user has all permissions', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = getParams();
				const targetParams = getTargetParams();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { sourceParams, targetParams, userId };
			};

			it('should call authorizationService.checkPermissionByReferences by source params', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId,
					sourceParams.parentType,
					sourceParams.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences by copyFilesParams', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId,
					targetParams.target.parentType,
					targetParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { requestParams: sourceParams, userId } = getParams();
				const targetParams = getTargetParams();
				const error = new ForbiddenException();

				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should throw Error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service copies files successfully', () => {
			const setup = () => {
				const { params: sourceParams, userId, fileRecords } = getFileRecordsWithParams();
				const targetParams = getTargetParams();
				const sourceFile = fileRecords[0];
				const targetFile = fileRecords[1];

				const fileResponse = new CopyFileResponse({
					id: targetFile.id,
					sourceId: sourceFile.id,
					name: targetFile.name,
				});

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockResolvedValueOnce([[fileResponse], 1]);

				return { sourceParams, targetParams, userId, fileResponse };
			};

			it('should call service with correct params', async () => {
				const { sourceParams, targetParams, userId } = setup();

				await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(filesStorageService.copyFilesOfParent).toHaveBeenCalledWith(userId, sourceParams, targetParams);
			});

			it('should return copied files responses', async () => {
				const { sourceParams, targetParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams);

				expect(result).toEqual([[fileResponse], 1]);
			});
		});

		describe('WHEN service copy throws error', () => {
			const setup = () => {
				const { params: sourceParams, userId } = getFileRecordsWithParams();
				const targetParams = getTargetParams();

				const error = new Error('test');

				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copyFilesOfParent.mockRejectedValueOnce(error);

				return { sourceParams, targetParams, userId, error };
			};

			it('should pass error', async () => {
				const { sourceParams, targetParams, userId, error } = setup();

				await expect(filesStorageUC.copyFilesOfParent(userId, sourceParams, targetParams)).rejects.toThrow(error);
			});
		});
	});

	describe('copyOneFile()', () => {
		const getParamsForCopyOneFile = () => {
			const { userId, fileRecords } = getFileRecordsWithParams();
			const targetParams = getTargetParams();
			const fileRecord = fileRecords[0];

			const fileRecordId: EntityId = new ObjectId().toHexString();
			const singleFileParams = {
				fileRecordId,
			};
			const copyFileParams = { ...targetParams, fileNamePrefix: 'copy from' };

			return { singleFileParams, copyFileParams, userId, fileRecord };
		};

		describe('WHEN user has all permissions', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId, fileRecord };
			};

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId, fileRecord } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService.checkPermissionByReferences with copyFilesParams', async () => {
				const { copyFileParams, singleFileParams, userId } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					2,
					userId,
					copyFileParams.target.parentType,
					copyFileParams.target.parentId,
					{ action: Actions.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});
		});

		describe('WHEN user has no permission for source file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission for target file', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user has no permission at all', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should throw Error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN source file is successfully found', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();

				return { singleFileParams, copyFileParams, userId };
			};

			it('should call findOneById with correct params', async () => {
				const { copyFileParams, singleFileParams, userId } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(singleFileParams);
			});
		});

		describe('WHEN find source file throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should call authorizationService.checkPermissionByReferences with file record params', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);

				expect(filesStorageService.copy).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service copies files successfully', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				const fileResponse = new CopyFileResponse({
					id: fileRecord.id,
					sourceId: singleFileParams.fileRecordId,
					name: fileRecord.name,
				});

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockResolvedValueOnce([fileResponse]);

				return { singleFileParams, copyFileParams, userId, fileResponse, fileRecord };
			};

			it('should call service with correct params', async () => {
				const { copyFileParams, singleFileParams, userId, fileRecord } = setup();

				await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(filesStorageService.copy).toHaveBeenCalledWith(userId, [fileRecord], copyFileParams.target);
			});

			it('should return copied files responses', async () => {
				const { copyFileParams, singleFileParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { singleFileParams, copyFileParams, userId, fileRecord } = getParamsForCopyOneFile();

				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValue(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce().mockResolvedValueOnce();
				filesStorageService.copy.mockRejectedValueOnce(error);

				return { singleFileParams, copyFileParams, userId, fileRecord, error };
			};

			it('should pass error', async () => {
				const { copyFileParams, singleFileParams, userId, error } = setup();

				await expect(filesStorageUC.copyOneFile(userId, singleFileParams, copyFileParams)).rejects.toThrow(error);
			});
		});
	});
});
