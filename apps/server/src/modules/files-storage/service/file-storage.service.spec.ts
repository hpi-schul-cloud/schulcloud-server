import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, FileRecord, FileRecordParentType } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto/file-storage.params';
import { FilesStorageHelper } from '../helper';
import { FilesStorageService } from './file-storage.service';

describe('FilesStorageService', () => {
	let module: TestingModule;
	let service: FilesStorageService;
	let fileRecordRepo: DeepMocked<FileRecordRepo>;
	let storageClient: DeepMocked<S3ClientAdapter>;
	let filesStorageHelper: DeepMocked<FilesStorageHelper>;
	let orm: MikroORM;
	let fileRecord: FileRecord;
	let fileRecords: FileRecord[];

	const entityId: EntityId = new ObjectId().toHexString();
	const userId: EntityId = new ObjectId().toHexString();
	const schoolId: EntityId = new ObjectId().toHexString();

	beforeAll(async () => {
		orm = await setupEntities();

		fileRecord = fileRecordFactory.buildWithId({ name: 'text.txt' });
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageService,
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FileRecordRepo,
					useValue: createMock<FileRecordRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: FilesStorageHelper,
					useValue: createMock<FilesStorageHelper>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageService);
		storageClient = module.get(S3ClientAdapter);
		fileRecordRepo = module.get(FileRecordRepo);
		filesStorageHelper = module.get(FilesStorageHelper);

		fileRecords = [
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
		];
		fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);

		fileRecordRepo.save.mockImplementation((entity: FileRecord | FileRecord[]) => {
			(entity as FileRecord).id = entityId;
			return Promise.resolve();
		});
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('deleteFilesOfParent()', () => {
		let requestParams: FileRecordParams;
		beforeEach(() => {
			requestParams = {
				schoolId,
				parentId: userId,
				parentType: FileRecordParentType.User,
			};
			fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([fileRecords, fileRecords.length]);
			storageClient.delete.mockResolvedValue([]);
		});

		describe('calls to fileRecordRepo.findBySchoolIdAndParentId()', () => {
			it('should call once', async () => {
				await service.deleteFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledTimes(1);
			});

			it('should call with correctly params', async () => {
				await service.deleteFilesOfParent(requestParams);
				expect(fileRecordRepo.findBySchoolIdAndParentId).toHaveBeenCalledWith(
					requestParams.schoolId,
					requestParams.parentId
				);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.findBySchoolIdAndParentId.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow();
			});
		});

		describe('calls to fileRecordRepo.save()', () => {
			it('should call with defined deletedSince params', async () => {
				await service.deleteFilesOfParent(requestParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ deletedSince: expect.any(Date) as Date })])
				);
			});

			it('should not call save if count equals 0', async () => {
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([[], 0]);
				await service.deleteFilesOfParent(requestParams);
				expect(fileRecordRepo.save).toHaveBeenCalledTimes(0);
			});

			it('should call with fileRecords in params', async () => {
				await service.deleteFilesOfParent(requestParams);
				expect(fileRecordRepo.save).toHaveBeenCalledWith(fileRecords);

				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ ...fileRecord[0] }),
						expect.objectContaining({ ...fileRecord[1] }),
						expect.objectContaining({ ...fileRecord[2] }),
					])
				);
			});

			it('should throw error if entity not found', async () => {
				fileRecordRepo.save.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow();
			});

			it('should call two times if call delete throw an error', async () => {
				storageClient.delete.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow();

				expect(fileRecordRepo.save).toHaveBeenCalledTimes(2);
			});
		});

		describe('calls to storageClient.delete', () => {
			it('should call with correct paths', async () => {
				const paths = ['1', '2'];
				filesStorageHelper.getPaths.mockReturnValue(paths);

				await service.deleteFilesOfParent(requestParams);

				expect(storageClient.delete).toHaveBeenCalledWith(paths);
			});

			it('should not call save if count equals 0', async () => {
				fileRecordRepo.findBySchoolIdAndParentId.mockResolvedValue([[], 0]);
				await service.deleteFilesOfParent(requestParams);
				expect(storageClient.delete).toHaveBeenCalledTimes(0);
			});

			it('should call fileRecordRepo.save with unmarked file record', async () => {
				storageClient.delete.mockRejectedValue(new Error());
				await expect(service.deleteFilesOfParent(requestParams)).rejects.toThrow();
				expect(fileRecordRepo.save).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ deletedSince: undefined })])
				);
			});
		});

		it('should return file records and count', async () => {
			const responseData = await service.deleteFilesOfParent(requestParams);
			expect(responseData[0]).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0] }),
					expect.objectContaining({ ...fileRecords[1] }),
					expect.objectContaining({ ...fileRecords[2] }),
				])
			);
			expect(responseData[1]).toEqual(fileRecords.length);
		});
	});
});
