import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TaskRepo } from './task.repo';
import {
	CourseGroupInfo,
	CourseTaskInfo,
	FileTaskInfo,
	LessonTaskInfo,
	Submission,
	Task,
	UserTaskInfo,
} from '../entity';
import { SubmissionRepo } from './submission.repo';

describe('TaskService', () => {
	let module: TestingModule;
	let mongodb: MongoMemoryServer;
	let service: TaskRepo;
	let em: EntityManager;
	let orm: MikroORM;

	beforeAll(async () => {
		mongodb = new MongoMemoryServer();
		const dbUrl = await mongodb.getUri();
		module = await Test.createTestingModule({
			imports: [
				MikroOrmModule.forRoot({
					type: 'mongo',
					clientUrl: dbUrl,
					entities: [CourseTaskInfo, FileTaskInfo, LessonTaskInfo, Submission, Task, UserTaskInfo, CourseGroupInfo],
				}),
			],
			// TODO: do we want to mock the Submissions here?
			providers: [TaskRepo, { provide: 'ITaskSubmission', useClass: SubmissionRepo }],
		}).compile();
		service = module.get<TaskRepo>(TaskRepo);
		em = module.get<EntityManager>(EntityManager);
		orm = module.get<MikroORM>(MikroORM);
	});

	afterAll(async () => {
		await orm.close();
		await mongodb.stop();
		await module.close();
	});

	describe('findAllAssignedByTeacher', () => {
		it('should return task of teachers course', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const task = em.create(Task, { name: 'find me', course });
			await em.persistAndFlush([user, course, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(1);
			expect(result[0].name).toEqual(task.name);
		});

		it('should not return task of other course', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [] });
			const task = em.create(Task, { name: 'find me', course });
			await em.persistAndFlush([user, course, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
		});

		it('should not return private task of course', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const task = em.create(Task, { name: 'find me', course, private: true });
			await em.persistAndFlush([user, course, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
		});

		it('should return task in a visible lesson of the users course', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const lesson = em.create(LessonTaskInfo, { course, hidden: false });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(1);
		});

		it('should return task if lesson is null', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const task = em.create(Task, { name: 'roll some dice', lesson: null, course });
			await em.persistAndFlush([user, course, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(1);
		});

		it('should not return task in a lesson of a different course', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
			const lesson = em.create(LessonTaskInfo, { course });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
		});

		it('should not return task in a hidden lesson', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const lesson = em.create(LessonTaskInfo, { course, hidden: true });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
		});

		it('should not return task in a lesson when hidden is null', async () => {
			const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
			const course = em.create(CourseTaskInfo, { name: 'testCourse', teachers: [user] });
			const lesson = em.create(LessonTaskInfo, { course });
			const task = em.create(Task, { name: 'roll some dice', lesson, course });
			await em.persistAndFlush([user, course, lesson, task]);
			const [result, total] = await service.findAllAssignedByTeacher(user.id);
			expect(total).toEqual(0);
		});
	});

	describe('findAllOpenByStudent', () => {
		describe('return value', () => {
			it('should return the expected properties', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user], color: '#ffffff' });
				const task = em.create(Task, { name: 'roll some dice', course, dueDate: new Date() });
				await em.persistAndFlush([user, course, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
				expect(result[0]).toHaveProperty('name');
				expect(result[0]).toHaveProperty('dueDate');
				expect(result[0].course).toHaveProperty('name');
				expect(result[0].course).toHaveProperty('color');
			});

			it('should return a paginated result', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user], color: '#ffffff' });
				const tasks = await Promise.all([
					em.create(Task, { name: 'warmup', course, dueDate: new Date() }),
					em.create(Task, { name: 'run 100m', course, dueDate: new Date() }),
					em.create(Task, { name: '100 situps', course, dueDate: new Date() }),
					em.create(Task, { name: '100 pushups', course, dueDate: new Date() }),
				]);
				await em.persistAndFlush([user, course, ...tasks]);
				const [result, total] = await service.findAllOpenByStudent(user.id, { limit: 2, skip: 0 });
				expect(result.length).toEqual(2);
				expect(total).toEqual(4);
			});

			it('should be sorted with earlier duedates first', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user], color: '#ffffff' });
				const tasks = await Promise.all([
					em.create(Task, { name: '2nd', course, dueDate: new Date(Date.now() + 500) }),
					em.create(Task, { name: '1st', course, dueDate: new Date(Date.now() - 500) }),
				]);
				await em.persistAndFlush([user, course, ...tasks]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(2);
				expect(result[0].name).toEqual('1st');
				expect(result[1].name).toEqual('2nd');
			});
		});

		describe('open tasks in courses', () => {
			it('should return task of students course', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const task = em.create(Task, { name: 'roll some dice', course });
				await em.persistAndFlush([user, course, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
			});

			it('should not return task of other course', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
				const task = em.create(Task, { name: 'secret task', course });
				await em.persistAndFlush([user, course, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});

			it('should not return private task of course', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
				const task = em.create(Task, { name: 'secret task', course, private: true });
				await em.persistAndFlush([user, course, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});

			it('should not return task that has a submission by the user', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const task = em.create(Task, { name: 'roll some dice', course });
				const submission = em.create(Submission, { task, student: user });
				await em.persistAndFlush([user, course, submission, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});

			it('should not return task that has a submission by different user', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const otherUser = em.create(UserTaskInfo, { firstName: 'other', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const task = em.create(Task, { name: 'roll some dice', course });
				const submission = em.create(Submission, { task, student: otherUser });
				await em.persistAndFlush([user, otherUser, course, submission, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
			});

			it('should filter tasks that are more than one week overdue', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });

				const threeWeeksinMilliseconds = 1.814e9;
				const tasks = await Promise.all([
					em.create(Task, {
						name: 'should have done this some time ago',
						course,
						dueDate: new Date(Date.now() - threeWeeksinMilliseconds),
					}),
					em.create(Task, { name: 'should have done this recently', course }),
				]);
				await em.persistAndFlush([user, course, ...tasks]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
			});
		});

		describe('open tasks in lessons', () => {
			it('should return task in a visible lesson of the users course', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const lesson = em.create(LessonTaskInfo, { course, hidden: false });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
			});

			it('should return task if lesson is null', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const task = em.create(Task, { name: 'roll some dice', lesson: null, course });
				await em.persistAndFlush([user, course, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(1);
			});

			it('should not return task in a lesson of a different course', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [] });
				const lesson = em.create(LessonTaskInfo, { course });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});

			it('should not return task in a hidden lesson', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const lesson = em.create(LessonTaskInfo, { course, hidden: true });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});

			it('should not return task in a lesson when hidden is null', async () => {
				const user = em.create(UserTaskInfo, { firstName: 'test', lastName: 'student' });
				const course = em.create(CourseTaskInfo, { name: 'testCourse', students: [user] });
				const lesson = em.create(LessonTaskInfo, { course });
				const task = em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const [result, total] = await service.findAllOpenByStudent(user.id);
				expect(total).toEqual(0);
			});
		});
	});
});
