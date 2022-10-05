import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, FileRecordParentType } from '@shared/domain';
import { courseFactory, fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FileRecordUC } from '../uc/file-record.uc';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileRecordResponse } from './dto';
import { FilesStorageConsumer } from './files-storage.consumer';

describe('FilesStorageConsumer', () => {
	let module: TestingModule;
	let fileRecordUC: DeepMocked<FileRecordUC>;
	let filesStorageService: DeepMocked<FilesStorageUC>;
	let service: FilesStorageConsumer;
	let orm: MikroORM;

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				FilesStorageConsumer,
				{
					provide: FileRecordUC,
					useValue: createMock<FileRecordUC>(),
				},
				{
					provide: FilesStorageUC,
					useValue: createMock<FilesStorageUC>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		fileRecordUC = module.get(FileRecordUC);
		filesStorageService = module.get(FilesStorageUC);
		service = module.get(FilesStorageConsumer);
	});

	describe('copyFilesOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		it('should call filesStorageService.copyFilesOfParent with params', async () => {
			const payload = {
				userId: new ObjectId().toHexString(),
				source: {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				},
				target: {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				},
			};
			await service.copyFilesOfParent(payload);
			expect(filesStorageService.copyFilesOfParent).toBeCalledWith(payload.userId, payload.source, {
				target: payload.target,
			});
		});

		it('regular RPC handler should receive a valid RPC response', async () => {
			const sourceCourse = courseFactory.buildWithId();
			const targetCourse = courseFactory.buildWithId();
			const payload = {
				userId: new ObjectId().toHexString(),
				source: {
					parentId: sourceCourse.id,
					parentType: FileRecordParentType.Course,
					schoolId: sourceCourse.school.id,
				},
				target: {
					parentId: targetCourse.id,
					parentType: FileRecordParentType.Course,
					schoolId: targetCourse.school.id,
				},
			};
			filesStorageService.copyFilesOfParent.mockResolvedValue([[], 0]);
			const response = await service.copyFilesOfParent(payload);
			expect(response.message).toEqual([]);
		});
	});

	describe('fileRecordsOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		it('should call filesStorageService.fileRecordsOfParent with params', async () => {
			const payload = {
				parentId: new ObjectId().toHexString(),
				parentType: FileRecordParentType.Course,
				schoolId,
			};
			fileRecordUC.fileRecordsOfParent.mockResolvedValue([[], 0]);
			await service.fileRecordsOfParent(payload);
			expect(fileRecordUC.fileRecordsOfParent).toBeCalledWith('REMOVE_IF_MOVED_TO_SERVICE', payload);
		});

		it('should return array instances of FileRecordResponse', async () => {
			const payload = {
				parentId: new ObjectId().toHexString(),
				parentType: FileRecordParentType.Course,
				schoolId: new ObjectId().toHexString(),
			};

			const fileRecords = fileRecordFactory.buildList(3, payload);

			fileRecordUC.fileRecordsOfParent.mockResolvedValue([fileRecords, fileRecords.length]);
			const response = await service.fileRecordsOfParent(payload);
			expect(response.message[0]).toBeInstanceOf(FileRecordResponse);
		});
	});

	describe('deleteFilesOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		it('should call filesStorageService.deleteFilesOfParent with params', async () => {
			const payload = {
				parentId: new ObjectId().toHexString(),
				parentType: FileRecordParentType.Course,
				schoolId,
			};
			filesStorageService.deleteFilesOfParent.mockResolvedValue([[], 0]);
			await service.deleteFilesOfParent(payload);
			expect(filesStorageService.deleteFilesOfParent).toBeCalledWith('REMOVE_IF_MOVED_TO_SERVICE', payload);
		});

		it('should return array instances of FileRecordResponse', async () => {
			const payload = {
				parentId: new ObjectId().toHexString(),
				parentType: FileRecordParentType.Course,
				schoolId: new ObjectId().toHexString(),
			};

			const fileRecords = fileRecordFactory.buildList(3, payload);

			filesStorageService.deleteFilesOfParent.mockResolvedValue([fileRecords, fileRecords.length]);
			const response = await service.deleteFilesOfParent(payload);
			expect(response.message[0]).toBeInstanceOf(FileRecordResponse);
		});
	});
});
