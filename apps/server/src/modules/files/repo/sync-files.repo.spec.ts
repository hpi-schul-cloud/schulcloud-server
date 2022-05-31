import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { fileFactory, fileRecordFactory, taskFactory } from '@shared/testing';
import { SyncFilesRepo } from './sync-files.repo';

// It can be removed after transitioning file-handling to the new files-storage-microservice is completed.
// This repo is used for syncing the new filerecords collection with the old files collection.

describe('SyncTaskRepo', () => {
	let module: TestingModule;
	let repo: SyncFilesRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SyncFilesRepo],
		}).compile();

		repo = module.get(SyncFilesRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getTaskFilesToSync', () => {
		it('should not return tasks without associated files', async () => {
			const task = taskFactory.build({ name: 'task with file' });
			await em.persistAndFlush(task);

			const result = await repo.findTaskFilesToSync();

			expect(result).toHaveLength(0);
		});

		it('should return tasks with files without a corresponding filerecord', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);
			const task = taskFactory.build({ name: 'task with file' });
			task.fileIds = [file._id];
			await em.persistAndFlush(task);

			const result = await repo.findTaskFilesToSync();

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({ _id: task._id });
		});

		it('should not return tasks with files that have corresponding filerecords with same updatedAt', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);
			const filerecord = fileRecordFactory.build();
			filerecord.updatedAt = file.updatedAt;
			await em.persistAndFlush(filerecord);
			const fileFilerecord = fileFilerecordFactory.build({ fileId: file._id, filerecordId: filerecord._id });
			await em.persistAndFlush(fileFilerecord);
			const task = taskFactory.build({ name: 'task with file' });
			task.fileIds = [file._id];
			await em.persistAndFlush(task);

			const result = await repo.findTaskFilesToSync();

			expect(result).toHaveLength(0);
		});

		it('should return tasks with files that have corresponding filerecords with different updatedAt', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);
			const filerecord = fileRecordFactory.build();
			filerecord.updatedAt = new Date('2022-01-01T00:00:00.000Z');
			await em.persistAndFlush(filerecord);
			const fileFilerecord = fileFilerecordFactory.build({ fileId: file._id, filerecordId: filerecord._id });
			await em.persistAndFlush(fileFilerecord);
			const task = taskFactory.build({ name: 'task with file' });
			task.fileIds = [file._id];
			await em.persistAndFlush(task);

			const result = await repo.findTaskFilesToSync();

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({ _id: task._id });
		});
	});
});
