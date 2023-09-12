import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson } from '@shared/domain';
import { cleanupCollections, courseFactory, lessonFactory, materialFactory, taskFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { LessonCreateDto } from '@src/modules/lesson/types';
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

	describe('createLessonByDto', () => {
		const setup = async () => {
			const course = courseFactory.build();
			await em.persistAndFlush([course]);
			em.clear();

			return { course };
		};

		it('should return the instance of a Lesson', async () => {
			const { course } = await setup();

			const lessonCreateDto: LessonCreateDto = {
				name: 'new lesson',
				courseId: course.id,
			};

			const resultLesson = await repo.createLessonByDto(lessonCreateDto);

			expect(resultLesson.id).toBeDefined();
			expect(resultLesson.constructor.name).toBe('Lesson');
		});

		it('should return a lesson object with correct name', async () => {
			const { course } = await setup();

			const lessonCreateDto: LessonCreateDto = {
				name: 'other lesson',
				courseId: course.id,
			};

			const resultLesson = await repo.createLessonByDto(lessonCreateDto);

			expect(resultLesson.name).toEqual(lessonCreateDto.name);
			expect(resultLesson.course.id).toEqual(lessonCreateDto.courseId);
		});

		it('should return a lesson assigned to the right course', async () => {
			const { course } = await setup();

			const lessonCreateDto: LessonCreateDto = {
				name: 'third lesson',
				courseId: course.id,
			};

			const resultLesson = await repo.createLessonByDto(lessonCreateDto);

			expect(resultLesson.course.id).toEqual(lessonCreateDto.courseId);
		});
	});

	describe('findById', () => {
		it('should find the lesson', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([course, lesson]);
			em.clear();

			const resultLesson = await repo.findById(lesson.id);

			expect(resultLesson.id).toEqual(lesson.id);
			expect(resultLesson.name).toEqual(lesson.name);
		});

		it('should populate course', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([course, lesson]);
			em.clear();

			const resultLesson = await repo.findById(lesson.id);

			expect(resultLesson.course.name).toEqual(course.name);
		});

		it('should populate tasks', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course });
			const tasks = [taskFactory.build({ course, lesson }), taskFactory.draft().build({ course, lesson })];
			await em.persistAndFlush([course, lesson, ...tasks]);
			em.clear();

			const resultLesson = await repo.findById(lesson.id);

			expect(resultLesson.tasks.isInitialized()).toEqual(true);
			expect(resultLesson.tasks.length).toEqual(2);
		});

		it('should populate materials', async () => {
			const material = materialFactory.build();
			const lesson = lessonFactory.build({ materials: [material] });
			await em.persistAndFlush([lesson, material]);
			em.clear();

			const resultLesson = await repo.findById(lesson.id);

			expect(resultLesson.materials[0]).toEqual(material);
		});
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

		it('should populate tasks', async () => {
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course });
			const tasks = [taskFactory.build({ course, lesson }), taskFactory.draft().build({ course, lesson })];
			await em.persistAndFlush([course, lesson, ...tasks]);
			em.clear();

			const [[resultLesson]] = await repo.findAllByCourseIds([course.id]);
			expect(resultLesson.tasks.isInitialized()).toEqual(true);
			expect(resultLesson.tasks.length).toEqual(2);
		});

		it('should populate materials', async () => {
			const course = courseFactory.build();
			const material = materialFactory.build();
			const lesson = lessonFactory.build({ course, materials: [material] });
			await em.persistAndFlush([lesson, material]);
			em.clear();

			const [[resultLesson]] = await repo.findAllByCourseIds([course.id]);
			expect(resultLesson.materials[0]).toEqual(material);
		});
	});
});
