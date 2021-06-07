import { EntityManager } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from './task.repo';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Course, Lesson, Submission, Task } from '../entity';
import { UserInfo } from '../../news/entity';

describe('TaskService', () => {
	let mongoServer;
	let module: TestingModule;

	beforeAll(async () => {
		mongoServer = new MongoMemoryServer();
		const mongoUri = await mongoServer.getUri();
		module = await Test.createTestingModule({
			imports: [
				MikroOrmModule.forRoot({
					type: 'mongo',
					clientUrl: mongoUri,
					entities: [Task, Lesson, Course, Submission, UserInfo],
				}),
			],
			providers: [TaskRepo],
		}).compile();
	});

	afterAll(async () => {
		await mongoServer.stop();
	});

	describe('findAllOpenByStudent', () => {
		describe('return value', () => {
			it('should return the expected properties', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user], color: '#ffffff' });
				const task = await em.create(Task, { name: 'roll some dice', course, dueDate: new Date() });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
				expect(result[0]).toHaveProperty('name');
				expect(result[0]).toHaveProperty('duedate');
				expect(result[0]).toHaveProperty('courseName');
				expect(result[0]).toHaveProperty('displayColor');
			});
		});

		describe('open tasks in courses', () => {
			it('should return task of students course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const task = await em.create(Task, { name: 'roll some dice', course });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
			});

			it('should not return task of other course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [] });
				const task = await em.create(Task, { name: 'secret task', course });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});

			it('should not return private task of course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [] });
				const task = await em.create(Task, { name: 'secret task', course, private: true });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});

			it('should not return task that has a submission by the user', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const task = await em.create(Task, { name: 'roll some dice', course });
				const submission = await em.create(Submission, { homework: task, student: user });
				await em.persistAndFlush([user, course, submission, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});

			it('should not return task that has a submission by different user', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const otherUser = await em.create(UserInfo, { firstName: 'other', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const task = await em.create(Task, { name: 'roll some dice', course });
				const submission = await em.create(Submission, { homework: task, student: otherUser });
				await em.persistAndFlush([user, otherUser, course, submission, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
			});

			it('should filter tasks that are more than two weeks overdue', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });

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
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
			});
		});

		describe('open tasks in lessons', () => {
			it('should return task in a visible lesson of the users course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const lesson = await em.create(Lesson, { course, hidden: false });
				const task = await em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
			});

			it('should return task if lesson is null', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const task = await em.create(Task, { name: 'roll some dice', lesson: null, course });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(1);
			});

			it('should not return task in a lesson of a different course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [] });
				const lesson = await em.create(Lesson, { course });
				const task = await em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});

			it('should not return task in a hidden lesson', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const lesson = await em.create(Lesson, { course });
				const task = await em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});

			it('should not return task in a lesson when hidden is null', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const lesson = await em.create(Lesson, { course });
				const task = await em.create(Task, { name: 'roll some dice', lesson, course });
				await em.persistAndFlush([user, course, lesson, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.length).toEqual(0);
			});
		});
	});
});
