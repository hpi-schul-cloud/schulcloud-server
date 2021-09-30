import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { CourseGroup, Submission, Task, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { userFactory } from '@shared/domain/factory';

import { courseFactory } from '@shared/domain/factory/course.factory';
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
		await Promise.all([em.nativeDelete(Task, {}), em.nativeDelete(User, {}), em.nativeDelete(Submission, {})]);
	});

	describe('findAllByTasks', () => {
		it('should return only the requested submissions of homeworks', async () => {
			const student = userFactory.build();
			const task1 = new Task({ name: 'task #1' });
			const task2 = new Task({ name: 'task #2' });
			const task3 = new Task({ name: 'task #3' });
			task1.submissions.add(new Submission({ task: task1, comment: 'comment', student }));
			task2.submissions.add(new Submission({ task: task2, comment: 'comment', student }));
			task3.submissions.add(new Submission({ task: task3, comment: 'comment', student }));

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
			const task = new Task({ name: 'task #1' });
			task.submissions.add(new Submission({ task, comment: 'comment', student }));

			await em.persistAndFlush([task]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id);

			expect(count).toEqual(1);
			expect(result.length).toEqual(1);
			expect(result[0].student.id).toEqual(student.id);
		});

		it('should return submissions where the user is a team member', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			const task = new Task({ name: 'task #1' });
			task.submissions.add(new Submission({ student: student1, comment: '', task, teamMembers: [student1, student2] }));

			await em.persistAndFlush([task]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student1.id);
			expect(count).toEqual(1);
			expect(result[0].teamMembers[0].id).toEqual(student1.id);
		});

		it('should return submissions where the user is in the course group', async () => {
			const course = courseFactory.build();
			await em.persistAndFlush(course);

			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			const courseGroup = em.create(CourseGroup, { courseId: course._id, students: [student1, student2] });
			const task = new Task({ name: 'task #1', parent: course });
			const submission = new Submission({ student: student1, comment: '', task });
			submission.courseGroup = courseGroup;

			await em.persistAndFlush([task, courseGroup]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student1.id);

			expect(count).toEqual(1);
			expect(result[0]?.courseGroup?.students[0]?.id).toEqual(student1.id);
		});
	});
});
