import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { RenameFileParams, ScanResultParams, SingleFileParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
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
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
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

	describe('updateSecurityStatus is called', () => {
		describe('WHEN matching file exists', () => {
			const setup = () => {
				const { fileRecord } = buildFileRecordWithParams();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';

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
				const token = fileRecord.securityCheck.requestToken || '';

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
				const userId = new ObjectId().toHexString();
				const { fileRecord, params } = buildFileRecordWithParams();
				const data: RenameFileParams = { fileName: 'test_new_name.txt' };

				filesStorageService.getFileRecord.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.patchFilename.mockResolvedValueOnce(fileRecord);

				return { userId, params, fileRecord, data };
			};

			it('should call service method getFile with right parameters', async () => {
				const { userId, params, data } = setup();
				await filesStorageUC.patchFilename(userId, params, data);

				expect(filesStorageService.getFileRecord).toHaveBeenCalledWith(params);
			});

			it('should call authorisation with right parameters', async () => {
				const { userId, params, data, fileRecord } = setup();

				await filesStorageUC.patchFilename(userId, params, data);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					FileStorageAuthorizationContext.update
				);
			});

			it('should call service method patchFilename with right parameters', async () => {
				const { userId, params, fileRecord, data } = setup();

				await filesStorageUC.patchFilename(userId, params, data);

				expect(filesStorageService.patchFilename).toHaveBeenCalledWith(fileRecord, data);
			});

			it('should return modified fileRecord', async () => {
				const { userId, params, fileRecord, data } = setup();

				const result = await filesStorageUC.patchFilename(userId, params, data);

				expect(result).toEqual(fileRecord);
			});
		});
	});
});
