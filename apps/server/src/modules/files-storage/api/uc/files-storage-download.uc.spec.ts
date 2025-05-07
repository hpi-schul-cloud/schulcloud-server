import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageService, GetFileResponse, PreviewService } from '../../domain';
import { fileRecordTestFactory } from '../../testing';
import { SingleFileParams } from '../dto';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageUC, FileStorageAuthorizationContext } from './files-storage.uc';

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordTestFactory().build({ parentId: userId, storageLocationId });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
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

	describe('download is called', () => {
		describe('WHEN file is found, user is authorized and file is successfully downloaded', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.getName() };

				const fileResponse = createMock<GetFileResponse>();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValue();
				filesStorageService.download.mockResolvedValueOnce(fileResponse);

				return { fileDownloadParams, fileRecord, fileResponse };
			};

			it('should call getFile with correct params', async () => {
				const { fileDownloadParams } = setup();

				await filesStorageUC.download(fileDownloadParams);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(fileDownloadParams.fileRecordId);
			});

			it('should call checkPermissionByReferences with correct params', async () => {
				const { fileDownloadParams, fileRecord } = setup();
				const parentInfo = fileRecord.getParentInfo();

				await filesStorageUC.download(fileDownloadParams);

				const allowedType = FilesStorageMapper.mapToAllowedAuthorizationEntityType(parentInfo.parentType);
				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					allowedType,
					parentInfo.parentId,
					FileStorageAuthorizationContext.read
				);
			});

			it('should call donwload with correct params', async () => {
				const { fileDownloadParams, fileRecord } = setup();

				await filesStorageUC.download(fileDownloadParams);

				expect(filesStorageService.download).toHaveBeenCalledWith(fileRecord, fileDownloadParams.fileName, undefined);
			});

			it('should return correct result', async () => {
				const { fileDownloadParams, fileResponse } = setup();

				const result = await filesStorageUC.download(fileDownloadParams);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN getFile throws error', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.getName() };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockRejectedValueOnce(error);

				return { fileDownloadParams, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, error } = setup();

				await expect(filesStorageUC.download(fileDownloadParams)).rejects.toThrowError(error);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.getName() };
				const error = new ForbiddenException();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(error);

				return { fileDownloadParams, fileRecord };
			};

			it('should throw Error', async () => {
				const { fileDownloadParams } = setup();

				await expect(filesStorageUC.download(fileDownloadParams)).rejects.toThrow();
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.getName() };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValue();
				filesStorageService.download.mockRejectedValueOnce(error);

				return { fileDownloadParams, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, error } = setup();

				await expect(filesStorageUC.download(fileDownloadParams)).rejects.toThrow(error);
			});
		});
	});

	describe('downloadBySecurityToken is called', () => {
		describe('WHEN file is found and service downloads successfully', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
				const token = 'token';
				const fileResponse = createMock<GetFileResponse>();

				filesStorageService.getFileRecordBySecurityCheckRequestToken.mockResolvedValueOnce(fileRecord);
				filesStorageService.downloadFile.mockResolvedValueOnce(fileResponse);

				return { fileResponse, token, fileRecord };
			};

			it('should call getFile with correct params', async () => {
				const { token } = setup();

				await filesStorageUC.downloadBySecurityToken(token);

				expect(filesStorageService.getFileRecordBySecurityCheckRequestToken).toHaveBeenCalledWith(token);
			});

			it('should call downloadFile with correct params', async () => {
				const { token, fileRecord } = setup();

				await filesStorageUC.downloadBySecurityToken(token);

				expect(filesStorageService.downloadFile).toHaveBeenCalledWith(fileRecord);
			});

			it('should return correct response', async () => {
				const { token, fileResponse } = setup();

				const result = await filesStorageUC.downloadBySecurityToken(token);

				expect(result).toEqual(fileResponse);
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

		describe('WHEN downloadFile throws error', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
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
});
