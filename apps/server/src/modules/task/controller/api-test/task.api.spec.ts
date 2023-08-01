import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat, Permission } from '@shared/domain';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskCreateParams, TaskListResponse, TaskResponse, TaskUpdateParams } from '@src/modules/task/controller/dto';
import { Request } from 'express';
import request from 'supertest';

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

	describe('[GET]', () => {
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

		describe('when student is assigned to 1 task in course is given', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const student = createStudent();
				const course = courseFactory.build({
					teachers: [teacher.user],
					students: [student.user],
				});
				const task = taskFactory.build({ course, users: [student.user] });

				await em.persistAndFlush([teacher.user, teacher.account, student.user, student.account, course, task]);
				em.clear();

				return { student, task, teacher, course };
			};

			it('should find tasks to which student is assigned', async () => {
				const { student, task } = await setup();

				const response = await (await testApiClient.login(student.account)).get();
				const { data } = response.body as TaskListResponse;

				expect(response.statusCode).toBe(200);
				expect(data[0].id).toContain(task.id);
			});

			it('should finds all tasks as teacher (assignment does not change the result)', async () => {
				const { teacher } = await setup();

				const response = await (await testApiClient.login(teacher.account)).get();

				const { total } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(total).toBe(1);
			});
		});

		describe('when 2 students are in course but one is assigned to task is given', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const assignedStudent = createStudent();
				const notAssignedStudent = createStudent();
				const course = courseFactory.build({
					teachers: [teacher.user],
					students: [assignedStudent.user, notAssignedStudent.user],
				});
				const task = taskFactory.build({ course, users: [assignedStudent.user] });

				await em.persistAndFlush([
					teacher.user,
					teacher.account,
					assignedStudent.user,
					assignedStudent.account,
					notAssignedStudent.user,
					notAssignedStudent.account,
					course,
					task,
				]);
				em.clear();

				return { task, course, assignedStudent, notAssignedStudent };
			};

			it('student does not find tasks, it task has users assigned, but himself is not assigned', async () => {
				const { notAssignedStudent } = await setup();

				const response = await (await testApiClient.login(notAssignedStudent.account)).get();

				const { total } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(total).toBe(0);
			});
		});

		describe('when task has empty assignment list', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const student = createStudent();
				const course = courseFactory.build({
					teachers: [teacher.user],
					students: [student.user],
				});
				const task = taskFactory.build({ course, users: [] });

				await em.persistAndFlush([teacher.user, teacher.account, student.user, student.account, course, task]);
				em.clear();

				return { student, task, teacher, course };
			};

			it('student finds tasks, if task assignment list is empty', async () => {
				const { student, task } = await setup();

				const response = await (await testApiClient.login(student.account)).get();

				const { data } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(data[0].id).toContain(task.id);
			});
		});

		describe('when student is assigned to task but not part of course', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const student = createStudent();
				const course = courseFactory.build({
					teachers: [teacher.user],
					students: [],
				});
				const task = taskFactory.build({ course, users: [student.user] });

				await em.persistAndFlush([teacher.user, teacher.account, student.user, student.account, course, task]);
				em.clear();

				return { student, task, teacher, course };
			};

			it('student does not find tasks to which he is assigned, if he does not belong to course', async () => {
				const { student } = await setup();

				const response = await (await testApiClient.login(student.account)).get();

				const { total } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(total).toBe(0);
			});
		});
	});

	// TODO: refactor
	describe('When task-card feature is enabled', () => {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		let app: INestApplication;
		// eslint-disable-next-line @typescript-eslint/no-shadow
		let em: EntityManager;
		let currentUser: ICurrentUser;

		const setup = (permission) => {
			const roles = roleFactory.buildList(1, {
				permissions: [permission],
			});
			const user = userFactory.build({ roles });

			return user;
		};

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUser;
						return true;
					},
				})
				.compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', true);
		});

		it('GET :id should return existing task', async () => {
			const user = setup(Permission.HOMEWORK_VIEW);
			const task = taskFactory.build({ name: 'original name', creator: user });

			await em.persistAndFlush([user, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer())
				.get(`/tasks/${task.id}`)
				.set('Accept', 'application/json')
				.expect(200);

			expect((response.body as TaskResponse).id).toEqual(task.id);
		});
		it('POST should create a draft task', async () => {
			const teacher = setup(Permission.HOMEWORK_CREATE);
			const student = setup(Permission.HOMEWORK_VIEW);

			const course = courseFactory.build({ teachers: [teacher], students: [student] });

			await em.persistAndFlush([teacher, student, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer())
				.post(`/tasks`)
				.set('Accept', 'application/json')
				.send({ name: 'test', courseId: course.id, usersIds: [student.id] })
				.expect(201);

			expect((response.body as TaskResponse).status.isDraft).toEqual(true);
			expect((response.body as TaskResponse).users).toEqual([
				{ id: student.id, firstName: student.firstName, lastName: student.lastName },
			]);
		});
		it('PATCH :id should update a task', async () => {
			const user = setup(Permission.HOMEWORK_EDIT);
			const student1 = setup(Permission.HOMEWORK_VIEW);
			const student2 = setup(Permission.HOMEWORK_VIEW);
			const course = courseFactory.build({ teachers: [user], students: [student1, student2] });
			const lesson = lessonFactory.build({ course });
			const task = taskFactory.build({
				name: 'original name',
				creator: user,
				course,
				lesson,
				users: [student1],
			});

			await em.persistAndFlush([user, course, lesson, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const updateTaskParams = {
				name: 'updated name',
				courseId: course.id,
				lessonId: lesson.id,
				description: '<p>test</p>',
				availableDate: '2022-10-28T08:28:12.981Z',
				dueDate: '2023-10-28T08:28:12.981Z',
				usersIds: [student1.id, student2.id],
			};
			const response = await request(app.getHttpServer())
				.patch(`/tasks/${task.id}`)
				.set('Accept', 'application/json')
				.send(updateTaskParams)
				.expect(200);

			const responseTask = response.body as TaskResponse;
			expect(responseTask.name).toEqual(updateTaskParams.name);
			expect(responseTask.description).toEqual({
				content: updateTaskParams.description,
				type: InputFormat.RICH_TEXT_CK5,
			});
			expect(responseTask.availableDate).toEqual(updateTaskParams.availableDate);
			expect(responseTask.dueDate).toEqual(updateTaskParams.dueDate);
			expect(responseTask.courseId).toEqual(updateTaskParams.courseId);
			expect(responseTask.lessonName).toEqual(lesson.name);
			expect(responseTask.users).toEqual([
				{ id: student1.id, firstName: student1.firstName, lastName: student1.lastName },
				{ id: student2.id, firstName: student2.firstName, lastName: student2.lastName },
			]);
		});
		describe('business logic errors', () => {
			it('POST should fail if NOT availableDate < dueDate', async () => {
				const user = setup(Permission.HOMEWORK_CREATE);
				const course = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, course]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				await request(app.getHttpServer())
					.post(`/tasks`)
					.set('Accept', 'application/json')
					.send({ name: 'test', availableDate: '2022-11-09T15:06:30.771Z', dueDate: '2021-11-09T15:06:30.771Z' })
					.expect(400);
			});
			it('POST should fail if users do not belong to course', async () => {
				const teacher = setup(Permission.HOMEWORK_CREATE);
				const student1 = setup(Permission.HOMEWORK_VIEW);
				const student2 = setup(Permission.HOMEWORK_VIEW);
				const course = courseFactory.build({ teachers: [teacher], students: [student1] });

				await em.persistAndFlush([course, teacher, student1, student2]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const taskCreateParams: TaskCreateParams = { name: 'test', courseId: course.id, usersIds: [student2.id] };
				await request(app.getHttpServer())
					.post('/tasks')
					.set('Accept', 'application/json')
					.send(taskCreateParams)
					.expect(403);
			});
			it('PATCH :id should fail if NOT availableDate < dueDate', async () => {
				const user = setup(Permission.HOMEWORK_EDIT);
				const task = taskFactory.build({ name: 'original name', creator: user });

				await em.persistAndFlush([user, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const updateTaskParams = {
					name: 'updated name',
					description: '<p>test</p>',
					availableDate: '2022-10-28T08:28:12.981Z',
					dueDate: '2021-10-28T08:28:12.981Z',
				};
				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}`)
					.set('Accept', 'application/json')
					.send(updateTaskParams)
					.expect(400);
			});
			it('PATCH should fail if users do not belong to course', async () => {
				const teacher = setup(Permission.HOMEWORK_CREATE);
				const student1 = setup(Permission.HOMEWORK_VIEW);
				const student2 = setup(Permission.HOMEWORK_VIEW);
				const course = courseFactory.build({ teachers: [teacher], students: [student1] });
				const task = taskFactory.build({ name: 'original name', creator: teacher, course, users: [student1] });

				await em.persistAndFlush([teacher, student1, student2, course, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const taskUpdateParams: TaskUpdateParams = {
					name: 'test',
					courseId: course.id,
					usersIds: [student1.id, student2.id],
				};

				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}`)
					.set('Accept', 'application/json')
					.send(taskUpdateParams)
					.expect(403);
			});
		});
	});

	// TODO: refactor
	describe('When task-card feature is not enabled', () => {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		let app: INestApplication;
		// eslint-disable-next-line @typescript-eslint/no-shadow
		let em: EntityManager;
		let currentUser: ICurrentUser;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUser;
						return true;
					},
				})
				.compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.TASK_DASHBOARD_VIEW_V3],
			});
			const user = userFactory.build({ roles });

			return user;
		};

		it('create task should throw', async () => {
			const teacher = setup();
			const course = courseFactory.build({
				teachers: [teacher],
			});

			await em.persistAndFlush([teacher, course]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			const params = { name: 'test', courseId: course.id };
			await request(app.getHttpServer()).post(`/tasks`).set('Accept', 'application/json').send(params).expect(501);
		});

		it('Find task should throw', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const teacher = userFactory.build();
			const task = taskFactory.build({ creator: teacher, course, finished: [teacher, student] });

			await em.persistAndFlush([student, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);

			await request(app.getHttpServer()).get(`/tasks/${task.id}`).set('Accept', 'application/json').expect(501);
		});

		it('Update task should throw', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const teacher = userFactory.build();
			const task = taskFactory.build({ creator: teacher, course, finished: [teacher, student] });

			await em.persistAndFlush([student, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const params = {
				courseId: course.id,
				name: 'test',
			};
			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}`)
				.set('Accept', 'application/json')
				.send(params)
				.expect(501);
		});
	});
});
