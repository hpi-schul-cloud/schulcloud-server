import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, fileRecordFactory, schoolFactory, taskFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { FileRecord, FileRecordParentType, School, Task } from '@shared/domain';
import { FileRecordRepo } from './filerecord.repo';

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FileRecordRepo],
		}).compile();
		repo = module.get(FileRecordRepo);
		em = module.get(EntityManager);
	});

	let school1: School;
	let school2: School;
	let task: Task;

	beforeEach(() => {
		school1 = schoolFactory.buildWithId();
		school2 = schoolFactory.buildWithId();
		task = taskFactory.buildWithId();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findOneById', () => {
		it('should find an entity by its id', async () => {
			const fileRecord = fileRecordFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});
	});

	describe('save', () => {
		it('should save the passed entity', async () => {
			const fileRecord = fileRecordFactory.build();

			await repo.save(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeInstanceOf(FileRecord);
		});

		it('should update the updatedAt property', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);
			const origUpdatedAt = fileRecord.updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 20));
			fileRecord.name = `updated-${fileRecord.name}`;

			await repo.save(fileRecord);
			// load also from DB and test if value is set

			expect(fileRecord.updatedAt.getTime()).toBeGreaterThan(origUpdatedAt.getTime());
		});
	});

	describe('delete', () => {
		it('should delete existing entity', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);

			const exist = await repo.findOneById(fileRecord.id);
			expect(exist).toBeInstanceOf(FileRecord);

			await repo.delete(fileRecord);

			const notExistAnymore = await em.findOne(FileRecord, fileRecord.id);
			expect(notExistAnymore).not.toBeInstanceOf(FileRecord);
		});
	});

	describe('findBySchoolIdAndParentId', () => {
		it('should find an entity by its school id and target id', async () => {
			const fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId: school1.id,
				parentType: FileRecordParentType.Task,
				parentId: task.id,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: school2.id,
				parentType: FileRecordParentType.Task,
				parentId: task.id,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(school1.id, task.id);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([task.id, task.id, task.id]);
		});
	});

	describe('findBySecurityCheckRequestToken', () => {
		it('should find an entity by its requestToken', async () => {
			const fileRecord = fileRecordFactory.build({
				schoolId: school1.id,
				parentType: FileRecordParentType.Task,
				parentId: task.id,
			});
			const token = fileRecord.securityCheck.requestToken || '';
			await em.persistAndFlush(fileRecord);
			em.clear();
			const result = await repo.findBySecurityCheckRequestToken(token);
			expect(result).toBeInstanceOf(FileRecord);
			expect(result.securityCheck.requestToken).toEqual(token);
		});

		it('should throw error by wrong requestToken', async () => {
			const fileRecord = fileRecordFactory.build({
				schoolId: school1.id,
				parentType: FileRecordParentType.Task,
				parentId: task.id,
			});
			const token = 'wrong-token';
			await em.persistAndFlush(fileRecord);
			em.clear();

			await expect(repo.findBySecurityCheckRequestToken(token)).rejects.toThrow();
		});
	});
});
