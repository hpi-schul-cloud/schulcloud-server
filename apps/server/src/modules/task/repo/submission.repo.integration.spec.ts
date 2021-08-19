import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '../../database';
import { TaskTestHelper } from '../utils/TestHelper';
import { FileTaskInfo, LessonTaskInfo, Submission, Task, UserTaskInfo, CourseGroupInfo } from '../entity';

import { SubmissionRepo } from './submission.repo';

describe('submission repo', () => {
	let module: TestingModule;
	let repo: SubmissionRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [FileTaskInfo, LessonTaskInfo, Submission, Task, UserTaskInfo, CourseGroupInfo],
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
		await Promise.all([em.nativeDelete(Task, {}), em.nativeDelete(UserTaskInfo, {}), em.nativeDelete(Submission, {})]);
	});

	describe('getSubmissionsByTasksList', () => {
		it('should return only the requested submissions of homeworks', async () => {
			const helper = new TaskTestHelper();
			const students = helper.getUsers();

			const tasks = [helper.createTask(), helper.createTask(), helper.createTask()];

			const submissions = [
				helper.createSubmission(tasks[0]),
				helper.createSubmission(tasks[1]),
				helper.createSubmission(tasks[2]),
			];

			await em.persistAndFlush([...students, ...tasks, ...submissions]);

			const requestedTasks = [tasks[0], tasks[1]];
			const [result, count] = await repo.findByTasks(requestedTasks);
			expect(count).toEqual(2);
			expect(result).toHaveLength(2);
		});
	});

	describe('getAllSubmissionsByUser', () => {
		it('should return submissions that have the user as userId', async () => {
			const helper = new TaskTestHelper();
			const student = helper.getFirstUser();

			const task = helper.createTask();
			const submission = helper.createSubmission(task);

			await em.persistAndFlush([student, task, submission]);

			const [result, count] = await repo.findByUserId(student.id);

			expect(count).toEqual(1);
			expect(result.length).toEqual(1);
			expect(result[0].student.firstName).toEqual(student.firstName);
		});

		it('should return submissions where the user is a team member', async () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const students = helper.getUsers();
			const task = helper.createTask();

			const submission = helper.createTeamMemberSubmission(task, students);

			await em.persistAndFlush([...students, task, submission]);

			const [result, count] = await repo.findByUserId(students[0].id);
			expect(count).toEqual(1);
			expect(result[0].teamMembers[0].firstName).toEqual(students[0].firstName);
		});

		it('should return submissions where the user is in the course group', async () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const students = helper.getUsers();
			const task = helper.createTask();

			const courseGroup = em.create(CourseGroupInfo, { courseId: task.getParentId(), students });
			const submission = helper.createSubmission(task, students[1]);
			submission.courseGroup = courseGroup;

			await em.persistAndFlush([...students, task, submission, courseGroup]);

			const [result, count] = await repo.findByUserId(students[0].id);

			expect(count).toEqual(1);
			expect(result[0].courseGroup.students[0].firstName).toEqual(students[0].firstName);
		});
	});
});
