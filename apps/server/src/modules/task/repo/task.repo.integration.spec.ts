import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { SortOrder } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '../../database';

import { TaskTestHelper } from '../utils/TestHelper';
import { LessonTaskInfo, Task, UserTaskInfo } from '../entity';

import { TaskRepo } from './task.repo';

describe('TaskService', () => {
	let module: TestingModule;
	let repo: TaskRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [LessonTaskInfo, Task, UserTaskInfo],
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
		await Promise.all([
			em.nativeDelete(Task, {}),
			em.nativeDelete(UserTaskInfo, {}),
			em.nativeDelete(LessonTaskInfo, {}),
		]);
	});

	describe('findAll', () => {
		it('should return task of teachers course', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			task.changePrivate(false);

			await em.persistAndFlush([task]);
			const [result, total] = await repo.findAll([task.getParentId()]);
			expect(total).toEqual(1);
			expect(result[0].getName()).toEqual(task.getName());
		});

		it('should not return task that are not requested', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const otherTask = helper.createTask();
			task.changePrivate(false);

			await em.persistAndFlush([task, otherTask]);
			const [result, total] = await repo.findAll([task.getParentId()]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
		});

		it('should not return private task of course', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			task.changePrivate(true);

			await em.persistAndFlush([task]);
			const [result, total] = await repo.findAll([task.getParentId()]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should return task in a visible lesson of the users course', async () => {
			const helper = new TaskTestHelper();
			const { task, lesson, parentId } = helper.createLessonWithTask();
			lesson.hidden = false;
			task.changePrivate(false);

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await repo.findAll([parentId]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
		});

		it('should not return task from a hidden lesson', async () => {
			const helper = new TaskTestHelper();
			const { task, lesson, parentId } = helper.createLessonWithTask();
			lesson.hidden = true;
			task.changePrivate(false);

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await repo.findAll([parentId]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should not return task in a lesson when hidden is null', async () => {
			const helper = new TaskTestHelper();
			const { task, lesson, parentId } = helper.createLessonWithTask();
			// @ts-expect-error: Test case
			lesson.hidden = null;
			task.changePrivate(false);

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await repo.findAll([parentId]);
			expect(total).toEqual(0);
			expect(result).toHaveLength(0);
		});

		it('should return task if lesson is null', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			// @ts-expect-error: Test case - in database null exist
			task.lesson = null;
			task.changePrivate(false);

			await em.persistAndFlush([task]);
			const [result, total] = await repo.findAll([task.getParentId()]);
			expect(total).toEqual(1);
			expect(result).toHaveLength(1);
		});

		it.skip('should not return task in a lesson of a different course', async () => {
			/* look like it not testable anymore
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
			const lesson = em.create(LessonTaskInfo, { course });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await repo.findAll(user.id);
			expect(total).toEqual(0);
			*/
		});
	});

	describe('findAllCurrent', () => {
		describe('return value', () => {
			it('should return the expected properties', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.changePrivate(false);

				await em.persistAndFlush([task]);
				const [result, total] = await repo.findAllCurrent([task.getParentId()]);

				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('name');
				expect(result[0]).toHaveProperty('dueDate');
				expect(result[0]).toHaveProperty('parentId');
			});

			it('should return a paginated result', async () => {
				const helper = new TaskTestHelper();
				const parentId = helper.createEntityId();
				const task1 = helper.createTask(parentId);
				task1.changePrivate(false);
				const task2 = helper.createTask(parentId);
				task2.changePrivate(false);
				const task3 = helper.createTask(parentId);
				task3.changePrivate(false);
				const task4 = helper.createTask(parentId);
				task4.changePrivate(false);
				const tasks = [task1, task2, task3, task4];

				await em.persistAndFlush(tasks);
				const [result, total] = await repo.findAllCurrent([task1.getParentId()], [], {
					pagination: { limit: 2, skip: 0 },
				});
				expect(result.length).toEqual(2);
				expect(total).toEqual(4);
			});

			it('should be sorted with earlier duedates first', async () => {
				const helper = new TaskTestHelper();
				const parentId = helper.createEntityId();
				const dueDate1 = new Date(Date.now() + 500);
				const dueDate2 = new Date(Date.now() - 500);
				const task1 = helper.createTask(parentId, dueDate1);
				task1.changePrivate(false);
				const task2 = helper.createTask(parentId, dueDate2);
				task2.changePrivate(false);

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await repo.findAllCurrent([parentId], [], { order: { dueDate: SortOrder.asc } });
				expect(total).toEqual(2);
				expect(result[0].id).toEqual(task2.id);
				expect(result[1].id).toEqual(task1.id);
			});

			it('should not return private tasks', async () => {
				const helper = new TaskTestHelper();
				const parentId = helper.createEntityId();
				const task1 = helper.createTask(parentId);
				task1.changePrivate(true);
				await em.persistAndFlush([task1]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(0);
				expect(result.length).toEqual(0);
			});
		});

		describe('open tasks in courses', () => {
			it('should return task of students course', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.changePrivate(false);

				await em.persistAndFlush([task]);
				const [result, total] = await repo.findAllCurrent([task.getParentId()]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});

			it('should not return other tasks', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.changePrivate(false);
				const otherTask = helper.createTask();
				otherTask.changePrivate(false);

				await em.persistAndFlush([task, otherTask]);
				const [result, total] = await repo.findAllCurrent([task.getParentId()]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});

			it('should not return private task of course', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.changePrivate(true);

				await em.persistAndFlush([task]);
				const [result, total] = await repo.findAllCurrent([task.getParentId()]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not return task that is on the ignore list', async () => {
				const helper = new TaskTestHelper();
				const parentId = helper.createEntityId();
				const task1 = helper.createTask(parentId);
				task1.changePrivate(false);
				const task2 = helper.createTask(parentId);
				task2.changePrivate(false);

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await repo.findAllCurrent([parentId], [task2.id]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});

			it('should filter tasks that are more than one week overdue', async () => {
				const helper = new TaskTestHelper();
				const parentId = helper.createEntityId();

				const threeWeeksinMilliseconds = 1.814e9;
				const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);

				const task1 = helper.createTask(parentId, dueDate1);
				task1.changePrivate(false);
				const task2 = helper.createTask(parentId);
				task2.changePrivate(false);

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
		});

		describe('open tasks in lessons', () => {
			it('should return task in a visible lesson of the users course', async () => {
				const helper = new TaskTestHelper();
				const { task, lesson, parentId } = helper.createLessonWithTask();
				lesson.hidden = false;
				task.changePrivate(false);

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});

			it('should not return task in a hidden lesson', async () => {
				const helper = new TaskTestHelper();
				const { task, lesson, parentId } = helper.createLessonWithTask();
				lesson.hidden = true;
				task.changePrivate(false);

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not return task in a hidden lesson', async () => {
				const helper = new TaskTestHelper();
				const { task, lesson, parentId } = helper.createLessonWithTask();
				// @ts-expect-error: Test case
				lesson.hidden = null;
				task.changePrivate(false);

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not return task in a lesson when hidden is null', async () => {
				const helper = new TaskTestHelper();
				const { task, lesson, parentId } = helper.createLessonWithTask();
				// @ts-expect-error: Test case - in database null exist
				lesson.hidden = null;
				task.changePrivate(false);

				await em.persistAndFlush([task]);
				const [result, total] = await repo.findAllCurrent([parentId]);
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it.skip('should not return task in a lesson of a different task', async () => {
				/*
				I think it can not solved on this place after changes
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
				const lesson = em.create(LessonTaskInfo, { course });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await repo.findAllCurrent(user.id);
				expect(total).toEqual(0);
				*/
			});
		});
	});
});
