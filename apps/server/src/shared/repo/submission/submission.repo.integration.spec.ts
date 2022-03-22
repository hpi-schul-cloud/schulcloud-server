import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import {
	userFactory,
	courseFactory,
	taskFactory,
	submissionFactory,
	cleanupCollections,
	courseGroupFactory,
} from '@shared/testing';

import { SubmissionRepo } from './submission.repo';

describe('submission repo', () => {
	let module: TestingModule;
	let repo: SubmissionRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SubmissionRepo],
		}).compile();
		repo = module.get(SubmissionRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findAllByTasks', () => {
		it('should return only the requested submissions of homeworks', async () => {
			const student = userFactory.build();
			const task1 = taskFactory.build();
			const task2 = taskFactory.build();
			const task3 = taskFactory.build();
			task1.submissions.add(submissionFactory.build({ task: task1, student }));
			task2.submissions.add(submissionFactory.build({ task: task2, student }));
			task3.submissions.add(submissionFactory.build({ task: task3, student }));

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			const [result, count] = await repo.findAllByTaskIds([task1.id, task2.id]);
			expect(count).toEqual(2);
			expect(result).toHaveLength(2);
			const resultTaskIds = result.map((o) => o.task.id);
			expect(resultTaskIds.includes(task1.id)).toEqual(true);
			expect(resultTaskIds.includes(task2.id)).toEqual(true);
		});
	});

	describe('findAllByUserId', () => {
		it('should return submissions that have the user as userId', async () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			task.submissions.add(submissionFactory.build({ task, student }));

			await em.persistAndFlush([task]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id);

			expect(count).toEqual(1);
			expect(result.length).toEqual(1);
			expect(result[0].student.id).toEqual(student.id);
		});

		it('should return submissions when the user is a team member', async () => {
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const task = taskFactory.build();
			task.submissions.add(submissionFactory.build({ task, student: student1, teamMembers: [student1, student2] }));

			await em.persistAndFlush([task]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student1.id);
			expect(count).toEqual(1);
			expect(result[0].teamMembers[0].id).toEqual(student1.id);
		});

		it('should return submissions when the user is in the course group', async () => {
			const course = courseFactory.build();
			await em.persistAndFlush(course);

			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const courseGroup = courseGroupFactory.build({ course, students: [student1, student2] });
			const task = taskFactory.build({ course });
			const submission = submissionFactory.build({ student: student1, task });
			submission.courseGroup = courseGroup;

			await em.persistAndFlush([task, courseGroup]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student1.id);

			expect(count).toEqual(1);
			expect(result[0]?.courseGroup?.students[0]?.id).toEqual(student1.id);
		});
	});

	describe('findById', () => {
		it('should find a submission by its id', async () => {
			const submission = submissionFactory.build({ comment: 'important submission' });
			await em.persistAndFlush(submission);
			em.clear();

			const foundSubmission = await repo.findById(submission.id);
			expect(foundSubmission.comment).toEqual('important submission');
		});

		it('should throw error if the submission cannot be found by id', async () => {
			const unknownId = new ObjectId().toHexString();
			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow();
		});
	});

	describe('save', () => {
		it('should persist a submission in the database', async () => {
			const submission = submissionFactory.build({ comment: 'important submission' });
			await repo.save(submission);
			em.clear();

			const foundSubmission = await repo.findById(submission.id);
			expect(foundSubmission.comment).toEqual('important submission');
		});
	});

	describe('delete', () => {
		it('should remove a submission in the database', async () => {
			const submission = submissionFactory.build();
			await em.persistAndFlush(submission);
			em.clear();

			await repo.delete(submission);

			await expect(async () => {
				await repo.findById(submission.id);
			}).rejects.toThrow(`Submission not found ({ id: '${submission.id}' })`);
		});
	});
});
