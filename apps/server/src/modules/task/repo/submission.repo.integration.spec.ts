import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CourseTaskInfo, FileTaskInfo, LessonTaskInfo, Submission, Task, UserTaskInfo } from '../entity';
import { SubmissionRepo } from './submission.repo';

describe('submission repo', () => {
	let module: TestingModule;
	let mongodb: MongoMemoryServer;
	let repo: SubmissionRepo;
	let orm: MikroORM;
	let em: EntityManager;

	beforeAll(async () => {
		mongodb = new MongoMemoryServer();
		const dbUrl = await mongodb.getUri();
		module = await Test.createTestingModule({
			imports: [
				MikroOrmModule.forRoot({
					type: 'mongo',
					clientUrl: dbUrl,
					entities: [CourseTaskInfo, FileTaskInfo, LessonTaskInfo, Submission, Task, UserTaskInfo],
				}),
			],
			providers: [SubmissionRepo],
		}).compile();
		repo = module.get<SubmissionRepo>(SubmissionRepo);
		orm = module.get<MikroORM>(MikroORM);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		await mongodb.stop();
	});

	describe('getSubmissionsByTask', () => {
		it('should return the amount of submissions', async () => {
			const students = [
				em.create(UserTaskInfo, { firstName: 'firstname', lastName: 'lastname' }),
				em.create(UserTaskInfo, { firstName: 'firstname', lastName: 'lastname' }),
			];
			const course = em.create(CourseTaskInfo, { name: 'testCourse', students });
			const task = em.create(Task, { name: 'find me', course });
			const submissions = students.map((student) => {
				return em.create(Submission, { task, student });
			});
			await em.persistAndFlush([course, task, ...submissions, ...students]);

			const [result, count] = await repo.getSubmissionsByTask(task);
			expect(count).toEqual(students.length);
		});
	});

	describe.skip('getSubmissionsByTasksList', () => {
		it('should return only the requested submissions of homeworks', async () => {
			const students = [
				em.create(UserTaskInfo, { firstName: 'firstname', lastName: 'lastname' }),
				em.create(UserTaskInfo, { firstName: 'firstname', lastName: 'lastname' }),
			];

			const course1 = em.create(CourseTaskInfo, { name: 'testCourse1', students });
			const course2 = em.create(CourseTaskInfo, { name: 'course with part', students });
			const course3 = em.create(CourseTaskInfo, { name: 'course without adding student', students: [] });
			const task11 = em.create(Task, { name: 'find me11', course: course1 });
			const task12 = em.create(Task, { name: 'find me12', course: course1 });
			const task21 = em.create(Task, { name: 'find me21', course: course2 });
			const task22 = em.create(Task, { name: 'find me22', course: course2 });
			const task31 = em.create(Task, { name: 'find me31', course: course3 });
			const task32 = em.create(Task, { name: 'find me32', course: course3 });

			const submissions1 = students.map((student) => {
				return em.create(Submission, { task11, student });
			});
			const submissions2 = students.map((student) => {
				return em.create(Submission, { task12, student });
			});

			const submission3 = em.create(Submission, { task11, student: students[0] });
			await em.persistAndFlush([
				course1,
				course2,
				course3,
				task11,
				task12,
				task21,
				task22,
				task31,
				task32,
				submission3,
				...submissions2,
				...submissions1,
				...students,
			]);

			const requestedTask = [task11, task12, task21, task22, task31] : [Task];
			const [result, count] = await repo.getSubmissionsByTasksList(requestedTask);
			expect(count).toEqual(students.length);
		});
	});
});
