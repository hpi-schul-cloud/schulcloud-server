import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { lessonFactory, materialFactory } from '../testing';
import { ComponentProperties, ComponentType, LessonEntity } from './lesson.entity';
import { LessonRepo } from './lesson.repo';
import { Material } from './materials.entity';

describe('LessonRepo', () => {
	let module: TestingModule;
	let repo: LessonRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [LessonEntity, Material, Task, Submission, CourseEntity, CourseGroupEntity],
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
		await cleanupCollections(em);
		await em.nativeDelete(LessonEntity, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(LessonEntity);
	});

	describe('findById', () => {
		it('should find the lesson', async () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([course, lesson]);
			em.clear();
			const resultLesson = await repo.findById(lesson.id);
			// TODO for some reason, comparing the whole object does not work
			// expect(resultLesson).toEqual(lesson);
			expect(resultLesson.id).toEqual(lesson.id);
			expect(resultLesson.name).toEqual(lesson.name);
		});
		it('should populate course', async () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([course, lesson]);
			em.clear();
			const resultLesson = await repo.findById(lesson.id);
			expect(resultLesson.course.name).toEqual(course.name);
		});

		it('should populate tasks', async () => {
			const course = courseEntityFactory.build();
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
			const course1 = courseEntityFactory.build();
			const course2 = courseEntityFactory.build();
			const lesson1 = lessonFactory.build({ course: course1 });
			const lesson2 = lessonFactory.build({ course: course2 });

			await em.persistAndFlush([lesson1, lesson2]);
			em.clear();
			const [result, total] = await repo.findAllByCourseIds([course2.id]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(lesson2.name);
		});

		it('should not find lessons with no course assigned', async () => {
			const course = courseEntityFactory.build();
			const lesson1 = lessonFactory.build({ course });
			const lesson2 = lessonFactory.build({});

			await em.persistAndFlush([lesson1, lesson2]);
			em.clear();
			const [result, total] = await repo.findAllByCourseIds([course.id]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(lesson1.name);
		});

		it('should not find hidden lessons', async () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([lesson]);
			em.clear();
			const [result, total] = await repo.findAllByCourseIds([course.id], { hidden: false });
			expect(total).toBe(0);
			expect(result).toHaveLength(0);
		});

		it('should find hidden lessons', async () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([lesson]);
			em.clear();
			const [result, total] = await repo.findAllByCourseIds([course.id]);
			expect(total).toBe(1);
			expect(result).toHaveLength(1);
		});

		it('should order by position', async () => {
			const course = courseEntityFactory.build();
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
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course });
			const tasks = [taskFactory.build({ course, lesson }), taskFactory.draft().build({ course, lesson })];
			await em.persistAndFlush([course, lesson, ...tasks]);
			em.clear();
			const [[resultLesson]] = await repo.findAllByCourseIds([course.id]);
			expect(resultLesson.tasks.isInitialized()).toEqual(true);
			expect(resultLesson.tasks.length).toEqual(2);
		});

		it('should populate materials', async () => {
			const course = courseEntityFactory.build();
			const material = materialFactory.build();
			const lesson = lessonFactory.build({ course, materials: [material] });
			await em.persistAndFlush([lesson, material]);
			em.clear();

			const [[resultLesson]] = await repo.findAllByCourseIds([course.id]);
			expect(resultLesson.materials[0]).toEqual(material);
		});
	});

	describe('findByUserId', () => {
		it('should return lessons which contains a specific userId', async () => {
			// Arrange
			const userId = new ObjectId();
			const contentExample: ComponentProperties = {
				title: 'title',
				hidden: false,
				user: userId,
				component: ComponentType.TEXT,
				content: { text: 'test of content' },
			};
			const lesson1 = lessonFactory.buildWithId({ contents: [contentExample, contentExample] });
			const lesson2 = lessonFactory.buildWithId({ contents: [contentExample] });
			const lesson3 = lessonFactory.buildWithId();
			await em.persistAndFlush([lesson1, lesson2, lesson3]);
			em.clear();

			const emSpy = jest.spyOn(em, 'map');

			// Act
			const result = await repo.findByUserId(userId.toHexString());

			// Assert
			expect(emSpy).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(2);
			expect(result.some((lesson: LessonEntity) => lesson.id === lesson3.id)).toBeFalsy();
			const receivedContents = result.flatMap((o) => o.contents);
			receivedContents.forEach((content) => {
				expect(content.user).toEqual(userId);
			});
		});
	});

	describe('updateLessons', () => {
		it('should update Lessons without deleted user', async () => {
			// Arrange
			const userId = new ObjectId();
			const contentExample: ComponentProperties = {
				title: 'title',
				hidden: false,
				user: userId,
				component: ComponentType.TEXT,
				content: { text: 'test of content' },
			};
			const lesson1 = lessonFactory.buildWithId({ contents: [contentExample, contentExample] });
			await em.persistAndFlush([lesson1]);
			em.clear();

			// Arrange expected Array after User deletion
			lesson1.contents[0].user = undefined;

			// Act
			await repo.save([lesson1]);

			const result1 = await repo.findByUserId(userId.toHexString());
			expect(result1).toHaveLength(0);

			const result2 = await repo.findById(lesson1.id);
			const receivedContents = result2.contents;
			receivedContents.forEach((content) => {
				expect(content.user).toBe(null);
			});
		});
	});
});
