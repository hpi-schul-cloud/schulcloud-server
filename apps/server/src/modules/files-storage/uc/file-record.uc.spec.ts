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
import { FileRecordUC } from './file-record.uc';

describe('FileRecordUC', () => {
	let module: TestingModule;
	let service: FileRecordUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let orm: MikroORM;
	let fileParams: FileRecordParams;
	const userId: EntityId = new ObjectId().toHexString();
	const schoolId: EntityId = new ObjectId().toHexString();
	const scanResult: ScanResultParams = { virus_detected: false };
	const scanResultWithVirus: ScanResultParams = { virus_detected: true, virus_signature: 'Win.Test.EICAR_HDB-1' };

	beforeAll(async () => {
		orm = await setupEntities();
		fileParams = {
			schoolId,
			parentId: schoolId,
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
			],
		}).compile();

		service = module.get(FileRecordUC);
		fileRecordRepo = module.get(FileRecordRepo);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('fileRecordsOfParent', () => {
		it('should call repo method findBySchoolIdAndTargetId with right parameters', async () => {
			const { parentId } = fileParams;
			const fileRecords = fileRecordFactory.buildList(3, { parentId, schoolId });
			const spy = fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);

			await service.fileRecordsOfParent(userId, { schoolId, parentId, parentType: FileRecordParentType.School });

			expect(spy).toHaveBeenCalledWith(schoolId, parentId);
		});
	});

	describe('updateSecurityStatus', () => {
		it('should call repo method findBySecurityCheckRequestToken with right parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParams);
			const token = fileRecord.securityCheck.requestToken || '';

			const spy = fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);

			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(token);
		});

		it('should call repo method updateSecurityCheckStatus with right parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParams);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			// eslint-disable-next-line no-multi-assign
			const spy = (fileRecord.updateSecurityCheckStatus = jest.fn());
			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(ScanStatus.VERIFIED, undefined);
		});

		it('should call repo method updateSecurityCheckStatus with virus detected parameters', async () => {
			const fileRecord = fileRecordFactory.build(fileParams);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			// eslint-disable-next-line no-multi-assign
			const spy = (fileRecord.updateSecurityCheckStatus = jest.fn());
			await service.updateSecurityStatus(token, scanResultWithVirus);

			expect(spy).toHaveBeenCalledWith(ScanStatus.BLOCKED, 'Win.Test.EICAR_HDB-1');
		});

		it('should call repo method save()', async () => {
			const fileRecord = fileRecordFactory.build(fileParams);
			const token = fileRecord.securityCheck.requestToken || '';
			fileRecordRepo.findBySecurityCheckRequestToken.mockResolvedValue(fileRecord);
			const spy = fileRecordRepo.save.mockResolvedValue();

			await service.updateSecurityStatus(token, scanResult);

			expect(spy).toHaveBeenCalledWith(fileRecord);
		});
	});

	describe('patch', () => {
		let fileRecord: FileRecord;
		let fileRecords: FileRecord[];
		let data: RenameFileParams;
		let params: SingleFileParams;

		beforeEach(() => {
			fileRecords = fileRecordFactory.buildList(3, fileParams);
			fileRecord = fileRecordFactory.build({ ...fileParams, name: 'test.txt' });
			fileRecords.push(fileRecord);
			params = { fileRecordId: fileRecord.id };
			data = { fileName: 'test_new_name.txt' };
			fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, 3]);
			fileRecordRepo.findOneById.mockResolvedValue(fileRecord);
		});

		it('should call repo method findById with right parameters', async () => {
			await service.patchFilename(userId, params, data);
			expect(fileRecordRepo.findOneById).toHaveBeenCalledWith(fileRecord.id);
		});

		it('should call repo method findBySchoolIdAndParentId with right parameters', async () => {
			await service.patchFilename(userId, params, data);
			expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledWith(fileRecord.schoolId, fileRecord.parentId);
		});

		it('should call repo method save()', async () => {
			await service.patchFilename(userId, params, data);
			expect(fileRecordRepo.save).toHaveBeenCalled();
		});

		it('should return fileRecord with new file name', async () => {
			const result = await service.patchFilename(userId, params, data);
			expect(result.name).toStrictEqual('test_new_name.txt');
		});

		it('should throw ConflictException if file name exist', async () => {
			await expect(service.patchFilename(userId, params, { fileName: 'test.txt' })).rejects.toThrow(
				new ConflictException('FILE_NAME_EXISTS')
			);
		});
	});
});
