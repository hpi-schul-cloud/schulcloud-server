import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { LessonRepo } from './lesson.repo';
import { LessonTaskInfo } from '../entity';

describe('LessonRepo', () => {
	let module: TestingModule;
	let repo: LessonRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [LessonTaskInfo],
				}),
			],
			providers: [LessonRepo],
		}).compile();
		repo = module.get(LessonRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(LessonTaskInfo, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getPublishedLessonsIdsByCourseIds).toBe('function');
	});

	describe('getPublishedLessonsByCourseIds', () => {
		it('should return task in a visible lesson of passed courseIds', async () => {
			const courseIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];

			const lessons = [
				em.create(LessonTaskInfo, { courseId: courseIds[0], hidden: false }),
				em.create(LessonTaskInfo, { courseId: courseIds[1], hidden: false }),
				em.create(LessonTaskInfo, { courseId: courseIds[2], hidden: true }),
			];
			await em.persistAndFlush(lessons);
			const lessonIds = await repo.getPublishedLessonsIdsByCourseIds(courseIds);
			expect(lessonIds.length).toEqual(2);
		});

		// TODO: check coursegroups ?
	});
});
