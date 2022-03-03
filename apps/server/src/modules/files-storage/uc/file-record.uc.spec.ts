import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';

import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecordParentType, ScanStatus } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileParams, ScanResultDto } from '../controller/dto/file-storage.params';
import { FileRecordUC } from './file-record.uc';

describe('FileRecordUC', () => {
	let module: TestingModule;
	let service: FileRecordUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let orm: MikroORM;
	let fileParams: FileParams;
	const userId: EntityId = '620abb23697023333eadea99';
	const scanResult: ScanResultDto = { virus_detected: false };
	const scanResultWithVirus: ScanResultDto = { virus_detected: true, virus_signature: 'Win.Test.EICAR_HDB-1' };

	beforeAll(async () => {
		orm = await setupEntities();
		fileParams = {
			schoolId: '620abb23697023333eadea00',
			parentId: '620abb23697023333eadea00',
			parentType: FileRecordParentType.User,
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
			const { schoolId, parentId } = fileParams;
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
});
