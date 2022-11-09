import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ALL_ENTITIES, EntityId } from '@shared/domain';
import { courseFactory, fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FileRecord, FileRecordParentType } from '../entity';
import { FilesStorageService } from '../service/files-storage.service';
import { FileRecordResponse } from './dto';
import { FilesStorageConsumer } from './files-storage.consumer';

describe('FilesStorageConsumer', () => {
	let module: TestingModule;
	let filesStorageService: DeepMocked<FilesStorageService>;
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
		orm = await setupEntities([...ALL_ENTITIES, FileRecord]);
		module = await Test.createTestingModule({
			providers: [
				FilesStorageConsumer,
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
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

		filesStorageService = module.get(FilesStorageService);
		service = module.get(FilesStorageConsumer);
	});

	describe('copyFilesOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		describe('WHEN valid file exists', () => {
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
				const responseData = [{ id: '1', sourceId: '2', name: 'test.txt' }];
				filesStorageService.copyFilesOfParent.mockResolvedValue([responseData, responseData.length]);
				const response = await service.copyFilesOfParent(payload);
				expect(response.message).toEqual(responseData);
			});
		});
		describe('WHEN file not exists', () => {
			it('should return RpcMessage with empty array', async () => {
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
	});

	describe('fileRecordsOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		describe('WHEN valid file exists', () => {
			it('should call filesStorageService.fileRecordsOfParent with params', async () => {
				const payload = {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				};
				filesStorageService.getFileRecordsOfParent.mockResolvedValue([[], 0]);
				await service.getFilesOfParent(payload);
				expect(filesStorageService.getFileRecordsOfParent).toBeCalledWith(payload);
			});

			it('should return array instances of FileRecordResponse', async () => {
				const payload = {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId: new ObjectId().toHexString(),
				};

				const fileRecords = fileRecordFactory.buildList(3, payload);

				filesStorageService.getFileRecordsOfParent.mockResolvedValue([fileRecords, fileRecords.length]);
				const response = await service.getFilesOfParent(payload);
				expect(response.message[0]).toBeInstanceOf(FileRecordResponse);
			});
		});

		describe('WHEN file not exists', () => {
			it('should return RpcMessage with empty array', async () => {
				const payload = {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				};
				filesStorageService.getFileRecordsOfParent.mockResolvedValue([[], 0]);
				const response = await service.getFilesOfParent(payload);
				expect(response).toStrictEqual({ message: [] });
			});
		});
	});

	describe('deleteFilesOfParent()', () => {
		const schoolId: EntityId = new ObjectId().toHexString();
		describe('WHEN valid file exists', () => {
			it('should call filesStorageService.deleteFilesOfParent with params', async () => {
				const payload = {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				};
				filesStorageService.deleteFilesOfParent.mockResolvedValue([[], 0]);
				await service.deleteFilesOfParent(payload);
				expect(filesStorageService.deleteFilesOfParent).toBeCalledWith(payload);
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
		describe('WHEN file not exists', () => {
			it('should return RpcMessage with empty array', async () => {
				const payload = {
					parentId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.Course,
					schoolId,
				};
				filesStorageService.deleteFilesOfParent.mockResolvedValue([[], 0]);
				const response = await service.deleteFilesOfParent(payload);
				expect(response).toStrictEqual({ message: [] });
			});
		});
	});
});
