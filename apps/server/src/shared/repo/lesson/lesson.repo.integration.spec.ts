import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson } from '@shared/domain';
import { courseFactory, lessonFactory, cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { LessonRepo } from './lesson.repo';

describe('LessonRepo', () => {
	let module: TestingModule;
	let repo: LessonRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [LessonRepo],
		}).compile();
		repo = module.get(LessonRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(Lesson, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Lesson);
	});

	describe('findAllByCourseIds', () => {
		it('should find lessons by course ids', async () => {
			const course1 = courseFactory.build();
			const course2 = courseFactory.build();
			const lesson1 = lessonFactory.build({ course: course1 });
			const lesson2 = lessonFactory.build({ course: course2 });

			await em.persistAndFlush([lesson1, lesson2]);
			em.clear();

			const [result, total] = await repo.findAllByCourseIds([course2.id]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(lesson2.name);
		});

		it('should not find lessons with no course assigned', async () => {
			const course = courseFactory.build();
			const lesson1 = lessonFactory.build({ course });
			const lesson2 = lessonFactory.build({});

			await em.persistAndFlush([lesson1, lesson2]);
			em.clear();

			const [result, total] = await repo.findAllByCourseIds([course.id]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(lesson1.name);
		});

		it('should not find hidden lessons', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([lesson]);
			em.clear();

			const [result, total] = await repo.findAllByCourseIds([course.id], { hidden: false });
			expect(total).toBe(0);
			expect(result).toHaveLength(0);
		});

		it('should find hidden lessons', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([lesson]);
			em.clear();

			const [result, total] = await repo.findAllByCourseIds([course.id]);
			expect(total).toBe(1);
			expect(result).toHaveLength(1);
		});

		it('should order by position', async () => {
			const course = courseFactory.build();
			const lessons = [
				lessonFactory.build({ course, position: 2 }),
				lessonFactory.build({ course, position: 0 }),
				lessonFactory.build({ course, position: 1 }),
			];
			await em.persistAndFlush(lessons);
			em.clear();

			const expectedOrder = [lessons[1], lessons[2], lessons[0]].map((lesson) => lesson.id);
			const [results] = await repo.findAllByCourseIds([course.id]);
			expect(results.map((lesson) => lesson.id)).toEqual(expectedOrder);
		});
	});
});
