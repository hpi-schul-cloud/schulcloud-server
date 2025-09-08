import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Submission, Task } from '../repo';
import { submissionFactory, taskFactory } from '../testing';
import { SubmissionRepo } from './submission.repo';

describe('submission repo', () => {
	let module: TestingModule;
	let repo: SubmissionRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Submission, Task, LessonEntity, CourseEntity, CourseGroupEntity, Material],
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
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Submission);
	});

	describe('findById', () => {
		it(' should return the submission with populated courseGroup', async () => {
			const student = userFactory.build();
			const courseGroup = courseGroupEntityFactory.build({ students: [student] });
			const submission = submissionFactory.build({ courseGroup });
			await em.persistAndFlush(submission);
			em.clear();

			const result = await repo.findById(submission.id);

			expect(result.courseGroup?.name).toEqual(courseGroup.name);
		});

		it('should return the submission with populated task and nested lesson, course and courseGroup', async () => {
			const student = userFactory.build();
			const course = courseEntityFactory.build();
			const courseGroup = courseGroupEntityFactory.build({ students: [student], course });
			const lesson = lessonFactory.build({ course, courseGroup });
			const task = taskFactory.build({ course, lesson });
			const submission = submissionFactory.build({ courseGroup, task });
			await em.persistAndFlush(submission);
			em.clear();

			const result = await repo.findById(submission.id);

			expect(result.task?.name).toEqual(task.name);
			expect(result.task?.course?.name).toEqual(course.name);
			expect(result.task?.lesson?.name).toEqual(lesson.name);
			expect(result.task?.lesson?.course?.name).toEqual(course.name);
			expect(result.task?.lesson?.courseGroup?.name).toEqual(courseGroup.name);
			expect(result.task?.lesson?.courseGroup?.course?.name).toEqual(course.name);
		});
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
			expect(result[0].student?.id).toEqual(student.id);
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
			const course = courseEntityFactory.build();
			await em.persistAndFlush(course);
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const courseGroup = courseGroupEntityFactory.build({ course, students: [student1, student2] });
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

	describe('deleteUserFromTeam', () => {
		const setup = async () => {
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const submission1 = submissionFactory.build({ teamMembers: [student1, student2] });
			const submission2 = submissionFactory.build({ teamMembers: [student1] });
			await em.persistAndFlush([student1, student2, submission1, submission2]);
			em.clear();

			return { student1, student2, submission1, submission2 };
		};

		it('should return the number of updated submissions', async () => {
			const { student1 } = await setup();

			const count = await repo.deleteUserFromGroupSubmissions(student1.id);

			expect(count).toEqual(2);
		});

		it('should remove the user from the team members of the submissions', async () => {
			const { student1, student2, submission1, submission2 } = await setup();

			await repo.deleteUserFromGroupSubmissions(student1.id);

			const result1 = await repo.findById(submission1.id);
			expect(result1.teamMembers.getItems().map((user) => user.id)).toEqual([student2.id]);

			const result2 = await repo.findById(submission2.id);
			expect(result2.teamMembers.getItems().map((user) => user.id)).toEqual([]);
		});
	});

	describe('removeUserReference', () => {
		const setup = async () => {
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const submission1 = submissionFactory.build({ student: student1 });
			const submission2 = submissionFactory.build({ student: student2 });
			await em.persistAndFlush([student1, student2, submission1, submission2]);
			em.clear();

			return { student1, student2, submission1, submission2 };
		};

		it('should return the number of updated submissions', async () => {
			const { submission1, submission2 } = await setup();

			const count = await repo.removeUserReference([submission1.id, submission2.id]);

			expect(count).toEqual(2);
		});

		it('should remove the user reference from the submissions', async () => {
			const { submission1 } = await setup();

			await repo.removeUserReference([submission1.id]);

			const result1 = await repo.findById(submission1.id);
			expect(result1.student).toBeUndefined();
		});

		it('should not affect other submissions', async () => {
			const { submission1, submission2 } = await setup();

			await repo.removeUserReference([submission1.id]);

			const result2 = await repo.findById(submission2.id);
			expect(result2.student?.id).toEqual(submission2.student?.id);
		});
	});
});
