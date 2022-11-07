import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, fileFactory, fileRecordFactory, taskFactory } from '@shared/testing';
import { FileRecordParent } from '@src/modules/files-storage/entity/filerecord.entity';
import { SyncFilesRepo } from './sync-files.repo';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!

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

	afterEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getTaskFilesToSync', () => {
		it('should not return tasks without associated files', async () => {
			const task = taskFactory.build({ name: 'task with file' });
			await em.persistAndFlush(task);

			const result = await repo.findFilesToSync(FileRecordParent.Task, 50);

			expect(result).toHaveLength(0);
		});

		it('should return tasks with files without a corresponding filerecord', async () => {
			const files = fileFactory.buildList(1);
			const task = taskFactory.build({ name: 'task with file', files });
			await em.persistAndFlush(task);

			const result = await repo.findFilesToSync(FileRecordParent.Task, 50);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({ parentId: task._id });
		});

		it('should not return tasks with files that have corresponding filerecords with same updatedAt', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);
			const filerecord = fileRecordFactory.build();
			filerecord.updatedAt = file.updatedAt;
			await em.persistAndFlush(filerecord);
			await repo.saveAssociation(file._id.toHexString(), filerecord._id.toHexString());
			const task = taskFactory.build({ name: 'task with file' });
			task.files.add(file);
			await em.persistAndFlush(task);

			const result = await repo.findFilesToSync(FileRecordParent.Task, 50);

			expect(result).toHaveLength(0);
		});

		it('should return tasks with files that have corresponding filerecords with different updatedAt', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);
			const filerecord = fileRecordFactory.build();
			filerecord.updatedAt = new Date('2022-01-01T00:00:00.000Z');
			await em.persistAndFlush(filerecord);
			await repo.saveAssociation(file._id.toHexString(), filerecord._id.toHexString());
			const task = taskFactory.build({ name: 'task with file' });
			task.files.add(file);
			await em.persistAndFlush(task);

			const result = await repo.findFilesToSync(FileRecordParent.Task, 50);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({ parentId: task._id });
		});
	});
});
