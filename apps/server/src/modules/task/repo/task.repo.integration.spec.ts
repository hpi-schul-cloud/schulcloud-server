import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup, File, Lesson, SortOrder, Submission, Task, User, Role } from '@shared/domain';
import { userFactory } from '@shared/domain/factory';

import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { TaskRepo } from './task.repo';

describe('TaskRepo', () => {
	let module: TestingModule;
	let repo: TaskRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course, Task, Submission, User, Role, Lesson, CourseGroup, File],
				}),
			],
			providers: [TaskRepo],
		}).compile();
		repo = module.get(TaskRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.getDriver().dropCollections();
	});

	describe('findAll', () => {
		it('should return task of teachers course', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });

			await em.persistAndFlush([task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(task.name);
		});

		it('should not return task that are not requested', async () => {
			const course1 = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task1 = new Task({ name: 'task #1', private: false, parent: course1 });
			const course2 = new Course({ name: 'course #2', schoolId: new ObjectId() });
			const task2 = new Task({ name: 'task #2', private: false, parent: course2 });

			await em.persistAndFlush([task1, task2]);
			em.clear();

			const [result, total] = await repo.findAll([course1.id]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
			expect(result[0].id).toEqual(task1.id);
		});

		it('should not return private task of course', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: true, parent: course });

			await em.persistAndFlush([task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should return task in a visible lesson of the users course', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const lesson = new Lesson({ course, hidden: false });
			const task = new Task({ name: 'task #1', private: false, parent: course, lesson });

			await em.persistAndFlush([task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
		});

		it('should not return task from a hidden lesson', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const lesson = new Lesson({ course, hidden: true });
			const task = new Task({ name: 'task #1', private: false, parent: course, lesson });

			await em.persistAndFlush([task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should not return task in a lesson when hidden is null', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const lesson = new Lesson({ course });
			const task = new Task({ name: 'task #1', private: false, parent: course, lesson });
			// @ts-expect-error: Test case
			lesson.hidden = null;

			await em.persistAndFlush([lesson, task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should return task if lesson is null', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			// @ts-expect-error: Test case - in database null exist
			task.lesson = null;

			await em.persistAndFlush([task]);
			em.clear();

			const [result, total] = await repo.findAll([course.id]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
		});

		it.skip('should not return task in a lesson of a different course', async () => {});
	});

	describe('findAllCurrent', () => {
		describe('return value', () => {
			it('should populate the parent', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: false, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('parent');
				expect(result[0].parent?.id).toEqual(course.id);
			});
			it('should populate the lesson', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', private: false, parent: course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('lesson');
				expect(result[0].lesson?.id).toEqual(lesson.id);
			});
			it('should populate the list of submissions', async () => {
				const student = userFactory.build();
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: false, parent: course });
				task.submissions.add(new Submission({ task, student, comment: 'my solution to the task #1' }));

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('submissions');
				expect(result[0].submissions.length).toEqual(task.submissions.length);
				expect(result[0].submissions[0].id).toEqual(task.submissions[0].id);
			});
			it('should return the expected properties', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: false, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('name');
				expect(result[0]).toHaveProperty('dueDate');
				expect(result[0]).toHaveProperty('parent');
			});
			it('should return a paginated result', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task1 = new Task({ name: 'task #1', private: false, parent: course });
				const task2 = new Task({ name: 'task #2', private: false, parent: course });
				const task3 = new Task({ name: 'task #3', private: false, parent: course });
				const task4 = new Task({ name: 'task #4', private: false, parent: course });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id], {
					pagination: { limit: 2, skip: 0 },
				});
				expect(result.length).toEqual(2);
				expect(total).toEqual(4);
			});
			it('should be sorted with earlier duedates first', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const dueDate1 = new Date(Date.now() + 500);
				const dueDate2 = new Date(Date.now() - 500);
				const task1 = new Task({ name: 'task #1', private: false, parent: course, dueDate: dueDate1 });
				const task2 = new Task({ name: 'task #2', private: false, parent: course, dueDate: dueDate2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id], {
					order: { dueDate: SortOrder.asc },
				});
				expect(total).toEqual(2);
				expect(result[0].id).toEqual(task2.id);
				expect(result[1].id).toEqual(task1.id);
			});
			it('should not return private tasks', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: true, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(0);
				expect(result.length).toEqual(0);
			});
		});
		describe('open tasks in courses', () => {
			it('should return task of students course', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: false, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
			it('should not return other tasks', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: false, parent: course });
				const otherCourse = new Course({ name: 'course #2', schoolId: new ObjectId() });
				const otherTask = new Task({ name: 'task #2', private: false, parent: otherCourse });

				await em.persistAndFlush([task, otherTask]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
			it('should not return private task of course', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const task = new Task({ name: 'task #1', private: true, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it('should filter tasks that are more than one week overdue', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const threeWeeksinMilliseconds = 1.814e9;
				const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);
				const dueDate2 = new Date();
				const task1 = new Task({ name: 'task #1', private: false, parent: course, dueDate: dueDate1 });
				const task2 = new Task({ name: 'task #2', private: false, parent: course, dueDate: dueDate2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
		});
		describe('open tasks in lessons', () => {
			it('should return task in a visible lesson of the users course', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', private: false, parent: course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
			it('should not return task in a hidden lesson', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const lesson = new Lesson({ course, hidden: true });
				const task = new Task({ name: 'task #1', private: false, parent: course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it('should not return task in a lesson where hidden is null', async () => {
				const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
				const lesson = new Lesson({ course });
				const task = new Task({ name: 'task #1', private: false, parent: course, lesson });
				// @ts-expect-error: Test case - we have null values in the database
				lesson.hidden = null;

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllCurrent([course.id]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it.skip('should not return task in a lesson of a different task', async () => {});
		});
	});
});
