import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '../../database';

import { TaskRepo } from './task.repo';
import { TaskTestHelper } from '../utils/TestHelper';
import { LessonTaskInfo, Task, UserTaskInfo } from '../entity';

describe('TaskService', () => {
	let module: TestingModule;
	let service: TaskRepo;
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
		service = module.get(TaskRepo);
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

	describe('findAllAssignedByTeacher', () => {
		it('should return task of teachers course', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();

			await em.persistAndFlush([task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(task.name);
		});

		it('should not return task that are not requested', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const otherTask = helper.createTask();

			await em.persistAndFlush([task, otherTask]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(1);
		});

		it('should not return private task of course', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			task.private = true;

			await em.persistAndFlush([task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(0);
		});

		it('should return task in a visible lesson of the users course', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: false });

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(1);
		});

		it('should not return task in a hidden lesson', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: true });

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(0);
		});

		it('should not return task in a lesson when hidden is null', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: null });

			await em.persistAndFlush([lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(0);
		});

		it('should return task if lesson is null', async () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			task.lesson = null;

			await em.persistAndFlush([task]);
			const [result, total] = await service.findAllAssignedByTeacher([task.courseId]);
			expect(total).toEqual(1);
		});

		it.skip('should not return task in a lesson of a different course', async () => {
			/* look like it not testable anymore
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
			const lesson = em.create(LessonTaskInfo, { course });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
			*/
		});
	});

	describe('findAllByStudent', () => {
		describe('return value', () => {
			it('should return the expected properties', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();

				await em.persistAndFlush([task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);

				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('name');
				expect(result[0]).toHaveProperty('dueDate');
				expect(result[0]).toHaveProperty('courseId');
			});

			it('should return a paginated result', async () => {
				const helper = new TaskTestHelper();
				const task1 = helper.createTask();
				const task2 = helper.createTask();
				const task3 = helper.createTask();
				const task4 = helper.createTask();
				const tasks = [task1, task2, task3, task4];

				await em.persistAndFlush(tasks);
				const [result, total] = await service.findAllByStudent([task1.courseId], {
					limit: 2,
					skip: 0,
				});
				expect(result.length).toEqual(2);
				expect(total).toEqual(4);
			});

			it('should be sorted with earlier duedates first', async () => {
				const helper = new TaskTestHelper();
				const task1 = helper.createTask();
				task1.dueDate = new Date(Date.now() + 500);
				const task2 = helper.createTask();
				task1.dueDate = new Date(Date.now() - 500);

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await service.findAllByStudent([task1.courseId]);
				expect(total).toEqual(2);
				expect(result[0].id).toEqual(task2.id);
				expect(result[1].id).toEqual(task1.id);
			});
		});

		describe('open tasks in courses', () => {
			it('should return task of students course', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();

				await em.persistAndFlush([task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(1);
			});

			it('should not return other tasks', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				const otherTask = helper.createTask();

				await em.persistAndFlush([task, otherTask]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(1);
			});

			it('should not return private task of course', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.private = true;

				await em.persistAndFlush([task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(0);
			});

			it('should not return task that is on the ignore list', async () => {
				const helper = new TaskTestHelper();
				const task1 = helper.createTask();
				const task2 = helper.createTask();

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await service.findAllByStudent([task1.courseId], {}, [task2.id]);
				expect(total).toEqual(0);
			});

			it('should filter tasks that are more than one week overdue', async () => {
				const helper = new TaskTestHelper();
				const threeWeeksinMilliseconds = 1.814e9;
				const task1 = helper.createTask();
				task1.dueDate = new Date(Date.now() - threeWeeksinMilliseconds);
				const task2 = helper.createTask();

				await em.persistAndFlush([task1, task2]);
				const [result, total] = await service.findAllByStudent([task1.courseId]);
				expect(total).toEqual(1);
			});
		});

		describe('open tasks in lessons', () => {
			it('should return task in a visible lesson of the users course', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: false });
				task.lesson = lesson;

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(1);
			});

			it('should not return task in a hidden lesson', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: true });
				task.lesson = lesson;

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(0);
			});

			it('should not return task in a hidden lesson', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				const lesson = em.create(LessonTaskInfo, { courseId: task.courseId, hidden: true });
				task.lesson = lesson;

				await em.persistAndFlush([lesson, task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(0);
			});

			it('should not return task in a lesson when hidden is null', async () => {
				const helper = new TaskTestHelper();
				const task = helper.createTask();
				task.lesson = null;

				await em.persistAndFlush([task]);
				const [result, total] = await service.findAllByStudent([task.courseId]);
				expect(total).toEqual(0);
			});

			it.skip('should not return task in a lesson of a different task', async () => {
				/*
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
				const lesson = em.create(LessonTaskInfo, { course });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await service.findAllByStudent(user.id);
				expect(total).toEqual(0);
				*/
			});
		});
	});
});
