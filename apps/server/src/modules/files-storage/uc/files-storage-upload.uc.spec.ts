import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizableReferenceType, AuthorizationContextBuilder } from '@modules/authorization/domain';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { AxiosHeadersKeyValue, axiosResponseFactory, fileRecordFactory, setupEntities } from '@shared/testing';
import { DomainErrorHandler } from '@src/core';
import { LegacyLogger } from '@src/core/logger';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from 'express';
import { of } from 'rxjs';
import { Readable } from 'stream';
import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { ErrorType } from '../error';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FileRecordParentType, StorageLocation } from '../interface';
import { FileDtoBuilder, FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FilesStorageUC } from './files-storage.uc';

const createAxiosResponse = <T>(data: T, headers?: AxiosHeadersKeyValue) =>
	axiosResponseFactory.build({
		data,
		headers,
	});

const createAxiosErrorResponse = (): AxiosResponse => {
	const errorResponse: AxiosResponse = axiosResponseFactory.build({
		status: 404,
	});

	return errorResponse;
};

const buildFileRecordsWithParams = (storageLocation: StorageLocation = StorageLocation.SCHOOL) => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		storageLocation,
		storageLocationId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

const createRequest = () => {
	const request: DeepMocked<Request> = createMock<Request>({
		headers: {
			connection: 'keep-alive',
			'content-length': '10699',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20',
		},
		get: () => `10699`,
	});

	return request;
};

describe('FilesStorageUC upload methods', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
		httpService = module.get(HttpService);
		filesStorageService = module.get(FilesStorageService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('uploadFromUrl is called', () => {
		const createUploadFromUrlParams = (storageLocation: StorageLocation = StorageLocation.SCHOOL) => {
			const { params, userId, fileRecords } = buildFileRecordsWithParams(storageLocation);
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
				const { fileRecord, userId, uploadFromUrlParams, response } = createUploadFromUrlParams();

				httpService.get.mockReturnValueOnce(of(response));

				filesStorageService.uploadFile.mockResolvedValueOnce(fileRecord);

				return { uploadFromUrlParams, userId, response, fileRecord };
			};

			it('should call authorizationService with correct params', async () => {
				const { uploadFromUrlParams, userId } = setup();

				await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					uploadFromUrlParams.parentType,
					uploadFromUrlParams.parentId,
					{ action: Action.write, requiredPermissions: [Permission.FILESTORAGE_CREATE] }
				);
			});

			it('should call authorizationService for storage location', async () => {
				const { uploadFromUrlParams, userId } = setup();

				await filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams);

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					AuthorizableReferenceType.School,
					uploadFromUrlParams.storageLocationId,
					AuthorizationContextBuilder.write([])
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

				const expectedFileDescription = FileDtoBuilder.buildFromAxiosResponse(uploadFromUrlParams.fileName, response);
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
				const { userId, uploadFromUrlParams } = createUploadFromUrlParams();
				const error = new Error('test');
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(error);

				return { uploadFromUrlParams, userId, error };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams, userId, error } = setup();

				await expect(filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow(error);
			});
		});

		describe('WHEN httpService throws error', () => {
			const setup = () => {
				const { userId, uploadFromUrlParams } = createUploadFromUrlParams();

				const errorResponse: AxiosResponse = createAxiosErrorResponse();

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
				const { userId, uploadFromUrlParams, response } = createUploadFromUrlParams(StorageLocation.SCHOOL);
				const error = new Error('test');

				httpService.get.mockReturnValueOnce(of(response));
				filesStorageService.uploadFile.mockRejectedValueOnce(error);

				return { uploadFromUrlParams, userId };
			};

			it('should pass error', async () => {
				const { uploadFromUrlParams, userId } = setup();

				await expect(filesStorageUC.uploadFromUrl(userId, uploadFromUrlParams)).rejects.toThrow();
			});
		});
	});

	describe('upload is called', () => {
		describe('WHEN user is authorized, busboy emits event and file is uploaded successfully', () => {
			const setup = () => {
				const { params, userId, fileRecords } = buildFileRecordsWithParams(StorageLocation.INSTANCE);
				const fileRecord = fileRecords[0];
				const request = createRequest();
				const readable = Readable.from('abc');
				const fileInfo = {
					filename: fileRecord.name,
					encoding: '7-bit',
					mimeType: fileRecord.mimeType,
				};

				let resolveUploadFile: (value: FileRecord | PromiseLike<FileRecord>) => void;
				const fileRecordPromise = new Promise<FileRecord>((resolve) => {
					resolveUploadFile = resolve;
				});
				filesStorageService.uploadFile.mockImplementationOnce(() => fileRecordPromise);

				request.pipe.mockImplementation((requestStream) => {
					requestStream.emit('file', 'file', readable, fileInfo);

					requestStream.emit('finish');
					resolveUploadFile(fileRecord);

					return requestStream;
				});

				return { params, userId, request, fileRecord, readable, fileInfo };
			};

			it('should call checkPermissionByReferences', async () => {
				const { params, userId, request } = setup();

				await filesStorageUC.upload(userId, params, request);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(params.parentType);
				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					allowedType,
					params.parentId,
					FileStorageAuthorizationContext.create
				);
			});

			it('should call checkPermissionByReferences for storage location instance', async () => {
				const { params, userId, request } = setup();

				await filesStorageUC.upload(userId, params, request);

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					AuthorizableReferenceType.Instance,
					params.storageLocationId,
					AuthorizationContextBuilder.write([Permission.INSTANCE_VIEW])
				);
			});

			it('should call uploadFile with correct params', async () => {
				const { params, userId, request, readable, fileInfo } = setup();
				const file = FileDtoBuilder.buildFromRequest(fileInfo, readable);

				await filesStorageUC.upload(userId, params, request);
				expect(filesStorageService.uploadFile).toHaveBeenCalledWith(userId, params, file);
			});

			it('should return fileRecord', async () => {
				const { params, userId, request, fileRecord } = setup();

				const result = await filesStorageUC.upload(userId, params, request);

				expect(result).toEqual(fileRecord);
			});
		});

		describe('WHEN user is authorized, busboy emits event and filesStorageService throws error', () => {
			const setup = () => {
				const { params, userId, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const request = createRequest();
				const readable = Readable.from('abc');
				const error = new Error('test');

				const size = request.headers['content-length'];

				let rejectUploadFile: (value: Error) => void;
				const fileRecordPromise = new Promise<FileRecord>((resolve, reject) => {
					rejectUploadFile = reject;
				});
				filesStorageService.uploadFile.mockImplementationOnce(() => fileRecordPromise);

				request.get.mockReturnValue(size);
				request.pipe.mockImplementation((requestStream) => {
					requestStream.emit('file', 'file', readable, {
						filename: fileRecord.name,
						encoding: '7-bit',
						mimeType: fileRecord.mimeType,
					});

					requestStream.emit('finish');
					rejectUploadFile(error);

					return requestStream;
				});

				return { params, userId, request, error };
			};

			it('should pass error', async () => {
				const { params, userId, request, error } = setup();

				await expect(filesStorageUC.upload(userId, params, request)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { params, userId } = buildFileRecordsWithParams();
				const request = createRequest();
				const error = new ForbiddenException();

				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(error);

				return { params, userId, request, error };
			};

			it('should pass error', async () => {
				const { params, userId, request, error } = setup();

				await expect(filesStorageUC.upload(userId, params, request)).rejects.toThrowError(error);
			});
		});
	});
});
