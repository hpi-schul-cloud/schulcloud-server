import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { SingleFileParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { PermissionContexts } from '../files-storage.const';
import { IGetFileResponse } from '../interface/storage-client';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecord = fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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
				const { fileRecord, params, userId } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };

				const fileResponse = createMock<IGetFileResponse>();

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				filesStorageService.download.mockResolvedValueOnce(fileResponse);

				return { fileDownloadParams, userId, fileRecord, fileResponse };
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

			it('should call donwload with correct params', async () => {
				const { fileDownloadParams, userId, fileRecord } = setup();

				await filesStorageUC.download(userId, fileDownloadParams);

				expect(filesStorageService.download).toHaveBeenCalledWith(fileRecord, fileDownloadParams, undefined);
			});

			it('should return correct result', async () => {
				const { fileDownloadParams, userId, fileResponse } = setup();

				const result = await filesStorageUC.download(userId, fileDownloadParams);

				expect(result).toEqual(fileResponse);
			});
		});

		describe('WHEN getFile throws error', () => {
			const setup = () => {
				const { fileRecord, params, userId } = buildFileRecordWithParams();
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
				const { fileRecord, params, userId } = buildFileRecordWithParams();
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

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { fileRecord, params, userId } = buildFileRecordWithParams();
				const fileDownloadParams = { ...params, fileName: fileRecord.name };
				const error = new Error('test');

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValue();
				filesStorageService.download.mockRejectedValueOnce(error);

				return { fileDownloadParams, userId, error };
			};

			it('should pass error', async () => {
				const { fileDownloadParams, userId, error } = setup();

				await expect(filesStorageUC.download(userId, fileDownloadParams)).rejects.toThrow(error);
			});
		});
	});

	describe('downloadBySecurityToken is called', () => {
		describe('WHEN file is found and service downloads successfully', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
				const token = 'token';
				const fileResponse = createMock<IGetFileResponse>();

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

				expect(filesStorageService.downloadFile).toHaveBeenCalledWith(fileRecord.schoolId, fileRecord.id);
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
