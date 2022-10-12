import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import {
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';
import { PermissionContexts } from '../files-storage.const';
import { FilesStorageService } from '../service/files-storage.service';
import { FileRecordUC } from './file-record.uc';

describe('FileRecordUC', () => {
	let module: TestingModule;
	let service: FileRecordUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	let orm: MikroORM;

	const getFileParams = () => {
		const schoolId = new ObjectId().toHexString();
		const parentId = schoolId;
		const parentType = FileRecordParentType.School;

		return { schoolId, parentId, parentType };
	};

	const getFileRecord = () => {
		const fileParams = getFileParams();

		const fileRecord = fileRecordFactory.build({ ...fileParams, name: 'test.txt' });

		const params: SingleFileParams = { fileRecordId: fileRecord.id };

		return { fileRecord, params };
	};

	const getFileRecords = () => {
		const fileParams = getFileParams();

		const fileRecords = [
			fileRecordFactory.build({ ...fileParams, name: 'test.txt' }),
			fileRecordFactory.build({ ...fileParams, name: 'test2.txt' }),
			fileRecordFactory.build({ ...fileParams, name: 'test3.txt' }),
		];

		const params: FileRecordParams = {
			schoolId: fileParams.schoolId,
			parentId: fileParams.parentId,
			parentType: fileParams.parentType,
		};

		return { fileRecords, params };
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
				FileRecordUC,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
			],
		}).compile();

		service = module.get(FileRecordUC);
		filesStorageService = module.get(FilesStorageService);
		authorizationService = module.get(AuthorizationService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getFileRecordsOfParent is called', () => {
		describe('when user is authorised and valid files exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecords, params } = getFileRecords();

				filesStorageService.getFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { userId, params } = setup();

				await service.getFileRecordsOfParent(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					params.parentType,
					params.parentId,
					PermissionContexts.read
				);
			});

			it('should call service method getFilesOfParent with right parameters', async () => {
				const { userId, params } = setup();

				await service.getFileRecordsOfParent(userId, params);

				expect(filesStorageService.getFilesOfParent).toHaveBeenCalledWith(params);
			});

			it('should return counted file records', async () => {
				const { userId, params, fileRecords } = setup();

				const result = await service.getFileRecordsOfParent(userId, params);

				expect(result).toEqual([fileRecords, fileRecords.length]);
			});
		});

		describe('when user is not authorised', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecords, params } = getFileRecords();

				filesStorageService.getFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new Error('Bla'));

				return { userId, params, fileRecords };
			};

			it('should pass the error', async () => {
				const { userId, params } = setup();

				await expect(service.getFileRecordsOfParent(userId, params)).rejects.toThrowError(new Error('Bla'));
			});
		});

		describe('when user is authorised but no files exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const params = getFileParams();
				const fileRecords = [];

				filesStorageService.getFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should return empty counted file records', async () => {
				const { userId, params } = setup();

				const result = await service.getFileRecordsOfParent(userId, params);

				expect(result).toEqual([[], 0]);
			});
		});
	});

	describe('updateSecurityStatus is called', () => {
		describe('WHEN matching file exists', () => {
			const setup = () => {
				const { fileRecord } = getFileRecord();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';

				filesStorageService.updateSecurityStatus.mockResolvedValueOnce();

				return { scanResult, token };
			};

			it('should call service method updateSecurityStatus with right parameters', async () => {
				const { scanResult, token } = setup();

				await service.updateSecurityStatus(token, scanResult);

				expect(filesStorageService.updateSecurityStatus).toHaveBeenCalledWith(token, scanResult);
			});
		});

		describe('WHEN service throws an error', () => {
			const setup = () => {
				const { fileRecord } = getFileRecord();
				const scanResult: ScanResultParams = { virus_detected: false };
				const token = fileRecord.securityCheck.requestToken || '';

				filesStorageService.updateSecurityStatus.mockRejectedValueOnce(new Error('bla'));

				return { scanResult, token };
			};

			it('should pass this error', async () => {
				const { scanResult, token } = setup();

				await expect(service.updateSecurityStatus(token, scanResult)).rejects.toThrowError(new Error('bla'));

				expect(filesStorageService.updateSecurityStatus).toHaveBeenCalledWith(token, scanResult);
			});
		});
	});

	describe('patchFilename is called', () => {
		describe('WHEN user is authorised and single file exists', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecord, params } = getFileRecord();
				const data: RenameFileParams = { fileName: 'test_new_name.txt' };

				filesStorageService.getFile.mockResolvedValueOnce(fileRecord);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();
				filesStorageService.patchFilename.mockResolvedValueOnce(fileRecord);

				return { userId, params, fileRecord, data };
			};

			it('should call service method getFile with right parameters', async () => {
				const { userId, params, data } = setup();
				await service.patchFilename(userId, params, data);

				expect(filesStorageService.getFile).toHaveBeenCalledWith(params);
			});

			it('should call authorisation with right parameters', async () => {
				const { userId, params, data, fileRecord } = setup();

				await service.patchFilename(userId, params, data);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					PermissionContexts.update
				);
			});

			it('should call service method patchFilename with right parameters', async () => {
				const { userId, params, fileRecord, data } = setup();

				await service.patchFilename(userId, params, data);

				expect(filesStorageService.patchFilename).toHaveBeenCalledWith(fileRecord, data);
			});

			it('should return modified fileRecord', async () => {
				const { userId, params, fileRecord, data } = setup();

				const result = await service.patchFilename(userId, params, data);

				expect(result).toEqual(fileRecord);
			});
		});
	});
});
