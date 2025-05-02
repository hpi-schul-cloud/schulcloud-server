import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageService, PreviewService } from '../../domain';
import { fileRecordTestFactory } from '../../testing';
import { RenameFileParams, ScanResultParams, SingleFileParams } from '../dto';
import { FilesStorageUC, FileStorageAuthorizationContext } from './files-storage.uc';

const buildFileRecordWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecord = fileRecordTestFactory().build({ parentId: userId, storageLocationId });

	const params: SingleFileParams = {
		fileRecordId: fileRecord.id,
	};

	return { params, fileRecord, userId };
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

	describe('updateSecurityStatus is called', () => {
		describe('WHEN matching file exists', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.getSecurityToken() || '';

				filesStorageService.updateSecurityStatus.mockResolvedValueOnce();

				return { scanResult, token };
			};

			it('should call service method updateSecurityStatus with right parameters', async () => {
				const { scanResult, token } = setup();

				await filesStorageUC.updateSecurityStatus(token, scanResult);

				expect(filesStorageService.updateSecurityStatus).toHaveBeenCalledWith(token, scanResult);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.getSecurityToken() || '';

				filesStorageService.updateSecurityStatus.mockRejectedValueOnce(new Error('bla'));

				return { scanResult, token };
			};

			it('should pass this error', async () => {
				const { scanResult, token } = setup();

				await expect(filesStorageUC.updateSecurityStatus(token, scanResult)).rejects.toThrowError(new Error('bla'));

				expect(filesStorageService.updateSecurityStatus).toHaveBeenCalledWith(token, scanResult);
			});
		});
	});

	describe('patchFilename is called', () => {
		describe('WHEN user is authorised and single file exists', () => {
			const setup = () => {
				const { fileRecord, params } = buildFileRecordWithParams();
				const data: RenameFileParams = { fileName: 'test_new_name.txt' };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				filesStorageService.patchFilename.mockResolvedValueOnce(fileRecord);

				return { params, fileRecord, data };
			};

			it('should call service method getFile with right parameters', async () => {
				const { params, data } = setup();
				await filesStorageUC.patchFilename(params, data);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(params.fileRecordId);
			});

			it('should call authorisation with right parameters', async () => {
				const { params, data, fileRecord } = setup();

				await filesStorageUC.patchFilename(params, data);
				const props = fileRecord.getProps();

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					props.parentType,
					props.parentId,
					FileStorageAuthorizationContext.update
				);
			});

			it('should call service method patchFilename with right parameters', async () => {
				const { params, fileRecord, data } = setup();

				await filesStorageUC.patchFilename(params, data);

				expect(filesStorageService.patchFilename).toHaveBeenCalledWith(fileRecord, data.fileName);
			});

			it('should return modified fileRecord', async () => {
				const { params, fileRecord, data } = setup();

				const result = await filesStorageUC.patchFilename(params, data);

				expect(result).toEqual(fileRecord);
			});
		});
	});
});
