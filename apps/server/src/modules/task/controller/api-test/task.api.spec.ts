import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat, Permission } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	submissionFactory,
	taskFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskListResponse } from '@src/modules/task/controller/dto';

const tomorrow = new Date(Date.now() + 86400000);

const createStudent = () => {
	const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({}, [
		Permission.TASK_CARD_VIEW,
		Permission.TASK_DASHBOARD_VIEW_V3,
		Permission.HOMEWORK_VIEW,
	]);
	return { account: studentAccount, user: studentUser };
};

const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
	]);
	return { account: teacherAccount, user: teacherUser };
};

describe('Task Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'tasks');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] /tasks', () => {
		describe('when no authorization is provided', () => {
			it('should return 401', async () => {
				const { statusCode } = await testApiClient.get();
				expect(statusCode).toEqual(401);
			});
		});

		describe('when user is teacher with course and task', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({
					course,
					description: '<p>test</p>',
					descriptionInputFormat: InputFormat.RICH_TEXT_CK5,
				});
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course, task };
			};

			it('should return tasks that include the appropriate information of task.', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toHaveProperty('status');
				expect(result.data[0]).toHaveProperty('displayColor');
				expect(result.data[0]).toHaveProperty('name');
				expect(result.data[0]).toHaveProperty('description');
				expect(result.data[0].description).toEqual({ content: '<p>test</p>', type: InputFormat.RICH_TEXT_CK5 });
			});
		});

		describe('when user is substitution teacher in course with task', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ substitutionTeachers: [user] });
				const task = taskFactory.build({ course });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course, task };
			};
			it('should retun a status flag in task if the teacher is only a substitution teacher.', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.data[0].status.isSubstitutionTeacher).toEqual(true);
			});
		});

		describe('when user is teacher with draft task', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.draft().build({ creator: user, course });
				await em.persistAndFlush([account, user, course, task]);
				const loggedInClient = await testApiClient.login(account);
				em.clear();
				return { loggedInClient, teacher: user, course, task };
			};

			it('should return private tasks created by the user', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
				expect(result.data[0].status.isDraft).toEqual(true);
			});
		});

		describe('when user is teacher with unavailable task', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({ creator: user, course, availableDate: tomorrow });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course, task };
			};

			it('should return unavailable tasks created by the user', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});
		});

		describe('when user is teacher of course with unavailable task of other teacher in course', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const { account: otherTeacherAccount, user: otherTeacher } = createTeacher();

				const course = courseFactory.build({ teachers: [user, otherTeacher] });
				const task = taskFactory.build({ creator: otherTeacher, course, availableDate: tomorrow });

				await em.persistAndFlush([account, user, course, task, otherTeacher, otherTeacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, teacher: user, course, task, otherTeacher, otherTeacherAccount };
			};

			it('should not return unavailable tasks created by other users', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user is teacher with course and other unrelated user with draft task in the course is created', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const { account: otherUserAccount, user: otherUser } = createStudent();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.draft().build({ creator: otherUser, course });
				await em.persistAndFlush([account, user, course, task, otherUser, otherUserAccount]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course, task, otherUser, otherUserAccount };
			};

			it('should not return private tasks created by other users', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user is teacher with write permission in course', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				await em.persistAndFlush([account, user, course]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course };
			};

			it('should allow teacher to open it', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});

			it('should allow teacher to set modified pagination and set correct limit', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get().query({ limit: '100', skip: '100' });
				const result = response.body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 100, // maximum is 100
					skip: 100,
				});
			});

			it('should not allow teacher to set modified pagination limit greater then 100', async () => {
				const { loggedInClient } = await setup();

				const { statusCode } = await loggedInClient.get().query({ limit: '1000', skip: '100' });

				expect(statusCode).toEqual(400);
			});
		});

		describe('when user is teacher of course with 3 tasks', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });
				await em.persistAndFlush([account, user, course, task1, task2, task3]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course, task1, task2, task3 };
			};

			it('should return a list of tasks', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;
				expect(result.total).toEqual(3);
			});
		});

		describe('when user is teacher of 3 course with 1 task each', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course1 = courseFactory.build({ teachers: [user] });
				const course2 = courseFactory.build({ teachers: [user] });
				const course3 = courseFactory.build({ teachers: [user] });
				const task1 = taskFactory.build({ course: course1 });
				const task2 = taskFactory.build({ course: course2 });
				const task3 = taskFactory.build({ course: course3 });
				await em.persistAndFlush([account, user, course1, course2, course3, task1, task2, task3]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, teacher: user, course1, course2, course3, task1, task2, task3 };
			};

			it('should return a list of tasks from multiple courses', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;
				expect(result.total).toEqual(3);
			});
		});

		describe('when course with teacher, student and task is given but student has TASK_DASHBOARD_VIEW_V3 permission set', () => {
			const setup = async () => {
				const { account: teacherAccount, user: teacher } = createTeacher();
				const { account: studentAccount, user: student } = createTeacher();
				const course = courseFactory.build({ teachers: [teacher], students: [student] });
				await em.persistAndFlush([teacherAccount, studentAccount, teacher, student, course]);
				em.clear();
				return { teacherAccount, studentAccount, teacher, student, course };
			};

			it('should return nothing from courses when the student has only TASK_DASHBOARD_VIEW_V3 permissions', async () => {
				const { studentAccount } = await setup();

				const response = await (await testApiClient.login(studentAccount)).get();
				const result = response.body as TaskListResponse;
				expect(result.total).toEqual(0);
			});
		});

		describe('when course with student, teacher and 3 tasks are given', () => {
			const setup = async () => {
				const { account: teacherAccount, user: teacher } = createTeacher();
				const { account: studentAccount, user: student } = createStudent();
				const course = courseFactory.build({ teachers: [teacher], students: [student] });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });

				await em.persistAndFlush([teacherAccount, studentAccount, teacher, student, course, task1, task2, task3]);
				em.clear();
				return { teacherAccount, studentAccount, teacher, student, course, task1, task2, task3 };
			};

			it('should return a list of tasks with additional tasks', async () => {
				const { studentAccount } = await setup();

				const response = await (await testApiClient.login(studentAccount)).get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(3);
			});
		});

		describe('when course with teacher, student, 1 finished task and 1 open submitted task is given', () => {
			const setup = async () => {
				const { account: teacherAccount, user: teacher } = createTeacher();
				const { account: studentAccount, user: student } = createStudent();
				const course = courseFactory.build({ teachers: [teacher], students: [student] });
				const openTask = taskFactory.build({ course });
				const finishedTask = taskFactory.build({ course, finished: [student] });
				openTask.submissions.add(submissionFactory.submitted().build({ task: openTask, student }));

				await em.persistAndFlush([teacherAccount, studentAccount, teacher, student, course, openTask, finishedTask]);
				em.clear();
				return { teacherAccount, studentAccount, teacher, student, course, openTask, finishedTask };
			};

			it('should return tasks that include the appropriate information of task with submission.', async () => {
				const { teacherAccount, course } = await setup();

				const response = await (await testApiClient.login(teacherAccount)).get();
				const result = response.body as TaskListResponse;

				expect(result.data[0]).toBeDefined();
				expect(result.data[0].status).toEqual({
					submitted: 1,
					maxSubmissions: course.getStudentIds().length,
					graded: 0,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});
			});

			it('should not return finished tasks for student', async () => {
				const { studentAccount } = await setup();
				const response = await (await testApiClient.login(studentAccount)).get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should return tasks that include the appropriate information.', async () => {
				const { studentAccount } = await setup();

				const response = await (await testApiClient.login(studentAccount)).get();
				const result = response.body as TaskListResponse;

				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toHaveProperty('status');
				expect(result.data[0]).toHaveProperty('displayColor');
				expect(result.data[0]).toHaveProperty('name');
				expect(result.data[0].status).toEqual({
					submitted: 1,
					maxSubmissions: 1,
					graded: 0,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});
			});

			it('should not return finished tasks', async () => {
				const { studentAccount } = await setup();

				const response = await (await testApiClient.login(studentAccount)).get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});
		});

		describe('when user is student with draft task', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course, private: true });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course };
			};

			it('should not return private tasks', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user is student with unavailable task and task is not created by student', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course, availableDate: tomorrow });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course };
			};

			it('should not return a task of a course that has no lesson and is not published', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user is student with unavailable task and task is created by student', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ creator: user, course, availableDate: tomorrow });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course };
			};

			it('should return unavailable tasks created by the student', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});
		});

		describe('when user is student with task with dueDate and task is not created by student', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				// @ts-expect-error expected value null in db
				const task = taskFactory.build({ course, dueDate: null });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course };
			};

			it('should return a task of a course that has no lesson and is not limited by date', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});
		});

		describe('when user is student of finished course with task', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const untilDate = new Date(Date.now() - 60 * 1000);
				const course = courseFactory.build({ untilDate, students: [user] });
				const task = taskFactory.build({ course });
				await em.persistAndFlush([account, user, course, task]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course, task };
			};

			it('should not return task of finished courses', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user is student with read permission in course', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				await em.persistAndFlush([account, user, course]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course };
			};

			it('should return 200 when student open it', async () => {
				const { loggedInClient } = await setup();

				const { statusCode } = await loggedInClient.get();

				expect(statusCode).toEqual(200);
			});

			it('should return empty tasks when student open it', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});

			it('should allow to modified pagination and set correct limit', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get().query({ limit: '100', skip: '100' });
				const result = response.body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 100, // maximum is 100
					skip: 100,
				});
			});

			it('should not allow to set modified pagination limit greater then 100', async () => {
				const { loggedInClient } = await setup();

				const { statusCode } = await loggedInClient.get().query({ limit: '1000', skip: '100' });

				expect(statusCode).toEqual(400);
			});
		});

		describe('when user is student of 3 course with 1 task each', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course1 = courseFactory.build({ students: [user] });
				const course2 = courseFactory.build({ students: [user] });
				const course3 = courseFactory.build({ students: [user] });
				const task1 = taskFactory.build({ course: course1 });
				const task2 = taskFactory.build({ course: course2 });
				const task3 = taskFactory.build({ course: course3 });
				await em.persistAndFlush([account, user, course1, course2, course3, task1, task2, task3]);
				em.clear();
				const loggedInClient = await testApiClient.login(account);
				return { loggedInClient, student: user, course1, course2, course3, task1, task2, task3 };
			};

			it('should return a list of tasks from multiple courses', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;
				expect(result.total).toEqual(3);
			});
		});
	});
});
