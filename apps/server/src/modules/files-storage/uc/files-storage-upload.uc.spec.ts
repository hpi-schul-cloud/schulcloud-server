import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from 'axios';
import { Request } from 'express';
import { of } from 'rxjs';
import { Readable } from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { ErrorType } from '../error';
import { PermissionContexts } from '../files-storage.const';
import { FileDtoBuilder, FilesStorageMapper } from '../mapper';
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

const createAxiosErrorResponse = (): AxiosResponse => {
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

	return errorResponse;
};

const buildFileRecordsWithParams = () => {
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

const createRequest = () => {
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

describe('FilesStorageUC upload methods', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let httpService: DeepMocked<HttpService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);

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

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('uploadFromUrl is called', () => {
		const createUploadFromUrlParams = () => {
			const { params, userId, fileRecords } = buildFileRecordsWithParams();
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
				const { userId, uploadFromUrlParams, response } = createUploadFromUrlParams();
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
				const { params, userId, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const request = createRequest();
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

				const fileDescription = FileDtoBuilder.buildFromRequest(fileInfo, request, buffer);

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
				const { params, userId } = buildFileRecordsWithParams();
				const request = createRequest();
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
				const { params, userId, fileRecords } = buildFileRecordsWithParams();
				const fileRecord = fileRecords[0];
				const request = createRequest();
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
				const { params, userId } = buildFileRecordsWithParams();
				const request = createRequest();
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
});
