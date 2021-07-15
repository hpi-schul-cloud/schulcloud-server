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

	describe('getSubmissionsByTasksList', () => {
		it('should return only the requested submissions of homeworks', async () => {
			const students = [em.create(UserTaskInfo, { firstName: 'firstname', lastName: 'lastname' })];

			const course = em.create(CourseTaskInfo, { name: 'testCourse1', students });
			const tasks = [
				em.create(Task, { name: 'find me11', course }),
				em.create(Task, { name: 'find me12', course }),
				em.create(Task, { name: 'find me12', course }),
			];

			const submissions = [
				em.create(Submission, { task: tasks[0], student: students[0] }),
				em.create(Submission, { task: tasks[1], student: students[0] }),
				em.create(Submission, { task: tasks[2], student: students[0] }),
			];

			await em.persistAndFlush([...students, ...tasks, ...submissions, course]);

			const requestedTasks = [tasks[0], tasks[1]];
			const [result, count] = await repo.getSubmissionsByTasksList(requestedTasks);
			expect(count).toEqual(2);
		});
	});
});
