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
				expect(result.total).toEqual(1);
				expect(result.data[0]).toHaveProperty('name');
				expect(result.data[0]).toHaveProperty('duedate');
				expect(result.data[0]).toHaveProperty('courseName');
				expect(result.data[0]).toHaveProperty('displayColor');
			});

			it('should return a paginated result', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user], color: '#ffffff' });
				const tasks = await Promise.all([
					em.create(Task, { name: 'warmup', course, dueDate: new Date() }),
					em.create(Task, { name: 'run 100m', course, dueDate: new Date() }),
					em.create(Task, { name: '100 situps', course, dueDate: new Date() }),
					em.create(Task, { name: '100 pushups', course, dueDate: new Date() }),
				]);
				await em.persistAndFlush([user, course, ...tasks]);
				const result = await service.findAllOpenByStudent(user.id, { limit: 2, skip: 0 });
				expect(result.data.length).toEqual(2);
				expect(result.total).toEqual(4);
			});

			it('should be sorted with earlier duedates first', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user], color: '#ffffff' });
				const tasks = await Promise.all([
					em.create(Task, { name: '2nd', course, dueDate: new Date(Date.now() + 500) }),
					em.create(Task, { name: '1st', course, dueDate: new Date(Date.now() - 500) }),
				]);
				await em.persistAndFlush([user, course, ...tasks]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.total).toEqual(2);
				expect(result.data[0].name).toEqual('1st');
				expect(result.data[1].name).toEqual('2nd');
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
				expect(result.total).toEqual(1);
			});

			it('should not return task of other course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [] });
				const task = await em.create(Task, { name: 'secret task', course });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.total).toEqual(0);
			});

			it('should not return private task of course', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [] });
				const task = await em.create(Task, { name: 'secret task', course, private: true });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.total).toEqual(0);
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
				expect(result.total).toEqual(0);
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
				expect(result.total).toEqual(1);
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
				expect(result.total).toEqual(1);
			});

			it('should return task if lesson is null', async () => {
				const service = module.get<TaskRepo>(TaskRepo);
				const em = module.get<EntityManager>(EntityManager);

				const user = await em.create(UserInfo, { firstName: 'test', lastName: 'student' });
				const course = await em.create(Course, { name: 'testCourse', students: [user] });
				const task = await em.create(Task, { name: 'roll some dice', lesson: null, course });
				await em.persistAndFlush([user, course, task]);
				const result = await service.findAllOpenByStudent(user.id);
				expect(result.total).toEqual(1);
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
				expect(result.total).toEqual(0);
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
				expect(result.total).toEqual(0);
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
				expect(result.total).toEqual(0);
			});
		});
	});
});
