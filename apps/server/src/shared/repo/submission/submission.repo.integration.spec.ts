import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Submission } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cleanupCollections,
	courseFactory,
	courseGroupFactory,
	submissionFactory,
	taskFactory,
	userFactory,
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

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Submission);
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
});
