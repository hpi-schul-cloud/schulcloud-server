import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { SubmissionRepo } from './submission.repo';
import { Submission, Task, UserTaskInfo, FileTaskInfo, LessonTaskInfo } from '../entity';

const getHex = () => new ObjectId().toHexString();

describe('SubmissionRepo', () => {
	let module: TestingModule;
	let repo: SubmissionRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Submission, Task, UserTaskInfo, FileTaskInfo, LessonTaskInfo],
				}),
			],
			providers: [SubmissionRepo],
		}).compile();
		repo = module.get(SubmissionRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Submission, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getSubmissionsByTasksList).toBe('function');
	});

	describe('getSubmissionsByTasksList', () => {
		it('should return submissions of passed task', async () => {
			const courseIds = [getHex(), getHex, getHex];
			const schoolId = getHex();

			const tasks = [
				em.create(Task, { schoolId, courseId: courseIds[0], private: false }),
				em.create(Task, { schoolId, courseId: courseIds[1], private: false }),
				em.create(Task, { schoolId, courseId: courseIds[2], private: true }),
			];

			const submissions = [
				em.create(Submission, { task: tasks[0] }),
				em.create(Submission, { task: tasks[0] }),
				em.create(Submission, { task: tasks[1] }),
				em.create(Submission, { task: tasks[1] }),
				em.create(Submission, { task: tasks[2] }),
				em.create(Submission, { task: tasks[2] }),
			];

			await em.persistAndFlush([...tasks, ...submissions]);
			const [result, total] = await repo.getSubmissionsByTasksList(tasks);
			expect(total).toEqual(6);
		});

		it.todo('should return right keys');
	});
});
