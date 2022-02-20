import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, fileRecordFactory, schoolFactory, taskFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { Course, FileRecordTargetType, School, Task } from '@shared/domain';
import { FileRecordRepo } from './filerecord.repo';

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ debug: true })],
			providers: [FileRecordRepo],
		}).compile();
		repo = module.get(FileRecordRepo);
		em = module.get(EntityManager);
	});

	let school1: School;
	let school2: School;
	let course: Course;
	let task: Task;

	beforeEach(() => {
		school1 = schoolFactory.buildWithId();
		school2 = schoolFactory.buildWithId();
		course = courseFactory.buildWithId();
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

	describe('findByTargetId', () => {
		it('should find an entity by its target id', async () => {
			const fileRecords1 = fileRecordFactory.buildList(3, {
				targetType: FileRecordTargetType.Course,
				targetId: course.id,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				targetType: FileRecordTargetType.Task,
				targetId: task.id,
			});
			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();
			const [results, count] = await repo.findByTargetId(course.id);
			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.targetId)).toEqual([course.id, course.id, course.id]);
		});
	});

	describe('findByTargetType', () => {
		it('should find an entity by its target type', async () => {
			const fileRecords1 = fileRecordFactory.buildList(3, {
				targetType: FileRecordTargetType.Course,
				targetId: course.id,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				targetType: FileRecordTargetType.Task,
				targetId: task.id,
			});
			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();
			const [results, count] = await repo.findByTargetType(FileRecordTargetType.Task);
			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.targetId)).toEqual([task.id, task.id, task.id]);
		});
	});

	describe('findBySchoolIdAndTargetId', () => {
		it('should find an entity by its school id and target id', async () => {
			const fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId: school1.id,
				targetType: FileRecordTargetType.Task,
				targetId: task.id,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: school2.id,
				targetType: FileRecordTargetType.Task,
				targetId: task.id,
			});
			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();
			const [results, count] = await repo.findBySchoolIdAndTargetId(school1.id, task.id);
			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.targetId)).toEqual([task.id, task.id, task.id]);
		});
	});

	describe('findBySchoolIdAndTargetType', () => {
		it('should find an entity by its school id and target id', async () => {
			const fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId: school1.id,
				targetType: FileRecordTargetType.Course,
				targetId: course.id,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: school2.id,
				targetType: FileRecordTargetType.Task,
				targetId: task.id,
			});
			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();
			const [results, count] = await repo.findBySchoolIdAndTargetType(school2.id, FileRecordTargetType.Task);
			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.targetId)).toEqual([task.id, task.id, task.id]);
		});
	});

	describe('when updating an existing entity', () => {
		it('should update the updatedAt property', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);
			const origUpdatedAt = fileRecord.updatedAt;
			await new Promise((resolve) => setTimeout(resolve, 20));
			fileRecord.name = `updated-${fileRecord.name}`;
			await repo.save(fileRecord);
			expect(fileRecord.updatedAt.getTime()).toBeGreaterThan(origUpdatedAt.getTime());
		});
	});
});
