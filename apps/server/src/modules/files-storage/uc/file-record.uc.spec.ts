import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';

import { FileRecordRepo } from '@shared/repo';
import { EntityId, FileRecordParentType } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileParams } from '../controller/dto/file-storage.params';
import { FileRecordUC } from './file-record.uc';

describe('FileRecordUC', () => {
	let module: TestingModule;
	let service: FileRecordUC;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let orm: MikroORM;
	let fileUploadParams: FileParams;
	const userId: EntityId = '620abb23697023333eadea99';

	beforeAll(async () => {
		orm = await setupEntities();
		fileUploadParams = {
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
			const { schoolId, parentId } = fileUploadParams;
			const fileRecords = fileRecordFactory.buildList(3, { parentId, schoolId });
			const spy = fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);

			await service.fileRecordsOfParent(userId, { schoolId, parentId, parentType: FileRecordParentType.School });

			expect(spy).toHaveBeenCalledWith(schoolId, parentId);
		});
	});
});
