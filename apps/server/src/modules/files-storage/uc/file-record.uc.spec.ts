import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, FileRecord, FileRecordParentType, ScanStatus } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
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
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	let orm: MikroORM;
	let fileParamsX: FileRecordParams;
	const userIdX: EntityId = new ObjectId().toHexString();
	const schoolIdX: EntityId = new ObjectId().toHexString();
	const scanResult: ScanResultParams = { virus_detected: false };
	const scanResultWithVirus: ScanResultParams = { virus_detected: true, virus_signature: 'Win.Test.EICAR_HDB-1' };

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
		fileParamsX = {
			schoolId: schoolIdX,
			parentId: schoolIdX,
			parentType: FileRecordParentType.School,
		};
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FileRecordUC,
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
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
		fileRecordRepo = module.get(FileRecordRepo);
		filesStorageService = module.get(FilesStorageService);
		authorizationService = module.get(AuthorizationService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('fileRecordsOfParent', () => {
		describe('when user is authorised and valid files existis', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecords, params } = getFileRecords();

				filesStorageService.getFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { userId, params } = setup();

				await service.fileRecordsOfParent(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					params.parentType,
					params.parentId,
					PermissionContexts.read
				);
			});

			it('should call service method getFilesOfParent with right parameters', async () => {
				const { userId, params } = setup();

				await service.fileRecordsOfParent(userId, params);

				expect(filesStorageService.getFilesOfParent).toHaveBeenCalledWith(params);
			});
		});

		describe('when user is not authorised', () => {
			// TODO:
		});

		describe('when user is authorised but no files existis', () => {
			// TODO:
		});
	});

	describe('updateSecurityStatus', () => {
		it('should call repo method findBySecurityCheckRequestToken with right parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParamsX);
			const token = fileRecord.securityCheck.requestToken || '';

			const spy = fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);

			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(token);
		});

		it('should call repo method updateSecurityCheckStatus with right parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParamsX);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			// eslint-disable-next-line no-multi-assign
			const spy = (fileRecord.updateSecurityCheckStatus = jest.fn());
			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(ScanStatus.VERIFIED, undefined);
		});

		it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParamsX);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			// eslint-disable-next-line no-multi-assign
			const spy = (fileRecord.updateSecurityCheckStatus = jest.fn());
			await service.updateSecurityStatus(token, scanResultWithVirus);

			expect(spy).toHaveBeenCalledWith(ScanStatus.BLOCKED, 'Win.Test.EICAR_HDB-1');
		});

		it('should call repo method save()', async () => {
			const fileRecord = fileRecordFactory.build(fileParamsX);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			const spy = fileRecordRepo.save.mockResolvedValue();

			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(fileRecord);
		});
	});

	describe('patchFilename is called', () => {
		describe('when user is authorised and single file exists', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecord, params } = getFileRecord();
				const fileRecords = [fileRecord];
				const data: RenameFileParams = { fileName: 'test_new_name.txt' };

				filesStorageService.getFile.mockResolvedValueOnce(fileRecord);
				filesStorageService.getFilesOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				fileRecordRepo.save.mockResolvedValueOnce();
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecord, data };
			};

			it('should call authorisation with right parameters', async () => {
				const { userId, params, data, fileRecord } = setup();

				await service.patchFilename(userId, params, data);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					fileRecord.parentType,
					fileRecord.parentId,
					PermissionContexts.read
				);
			});

			it('should call service method getFile with right parameters', async () => {
				const { userId, params, data } = setup();
				await service.patchFilename(userId, params, data);

				expect(filesStorageService.getFile).toHaveBeenCalledWith(params);
			});

			it('should call repo method getFilesOfParent with right parameters', async () => {
				const { userId, params, fileRecord, data } = setup();
				const expectedInternalParams: FileRecordParams = {
					schoolId: fileRecord.schoolId,
					parentId: fileRecord.parentId,
					parentType: fileRecord.parentType,
				};

				await service.patchFilename(userId, params, data);

				expect(filesStorageService.getFilesOfParent).toHaveBeenCalledWith(expectedInternalParams);
			});

			it('should call repo method save with right parameters', async () => {
				const { userId, params, fileRecord, data } = setup();

				await service.patchFilename(userId, params, data);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecord);
			});

			// TODO: Improve test that really is checked if it is modified
			it('should return modified fileRecord', async () => {
				const { userId, params, fileRecord, data } = setup();

				const result = await service.patchFilename(userId, params, data);

				expect(result).toEqual(fileRecord);
			});
		});
		/*
		// TODO: check tests after refactoring
		it.skip('should return fileRecord with new file name', async () => {
			const result = await service.patchFilename(userIdX, paramsX, dataX);
			expect(result.name).toStrictEqual('test_new_name.txt');
		});

		it.skip('should throw ConflictException if file name exist', async () => {
			await expect(service.patchFilename(userIdX, paramsX, { fileName: 'test.txt' })).rejects.toThrow(
				new ConflictException('FILE_NAME_EXISTS')
			);
		});
		*/
	});
});
