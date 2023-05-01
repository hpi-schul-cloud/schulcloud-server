import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat, Permission, Task } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	submissionFactory,
	taskFactory,
	TestRequest,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { TaskCreateParams, TaskListResponse, TaskResponse, TaskUpdateParams } from '@src/modules/task/controller/dto';
import { ObjectID } from 'bson';
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

// TODO: remove after refactoring
class API {
	app: INestApplication;

	routeName: string;

	constructor(app: INestApplication, routeName: string) {
		this.app = app;
		this.routeName = routeName;
	}

	async get(query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(this.routeName)
			.set('Accept', 'application/json')
			.set('Authorization', 'jwt')
			.query(query || {});

		return {
			result: response.body as TaskListResponse,
			status: response.status,
		};
	}

	async copyTask(taskId: string, courseId: string) {
		const params = { courseId };
		const response = await request(this.app.getHttpServer())
			.post(`/tasks/${taskId}/copy`)
			.set('Authorization', 'jwt')
			.send(params);

		const copyStatus = response.body as { id: string; title: string };

		return {
			status: response.status,
			copyStatus,
		};
	}
}

// rewrite tests to conform new code style
describe('Task Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiRequest: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		apiRequest = new TestRequest(app, 'tasks');
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
				const { statusCode } = await apiRequest.get();
				expect(statusCode).toEqual(401);
			});
		});

		describe('when user is teacher with write permission in course', () => {
			const setup = async () => {
				const { account, user } = createTeacher();
				const course = courseFactory.build({ teachers: [user] });
				await em.persistAndFlush([account, user, course]);
				em.clear();
				return { account, teacher: user, course };
			};

			it('should allow teacher to open it', async () => {
				const { account } = await setup();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});

			it('should allow teacher to set modified pagination and set correct limit', async () => {
				const { account } = await setup();

				const { body } = await apiRequest.get(undefined, account, { limit: '100', skip: '100' });
				const result = body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 100, // maximum is 100
					skip: 100,
				});
			});

			it('should not allow teacher to set modified pagination limit greater then 100', async () => {
				const { account } = await setup();

				const { statusCode } = await apiRequest.get(undefined, account, { limit: '1000', skip: '100' });

				expect(statusCode).toEqual(400);
			});

			it('should return tasks that include the appropriate information of task.', async () => {
				const { account, course } = await setup();
				const task = taskFactory.build({
					course,
					description: '<p>test</p>',
					descriptionInputFormat: InputFormat.RICH_TEXT_CK5,
				});
				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toHaveProperty('status');
				expect(result.data[0]).toHaveProperty('displayColor');
				expect(result.data[0]).toHaveProperty('name');
				expect(result.data[0]).toHaveProperty('description');
				expect(result.data[0].description).toEqual({ content: '<p>test</p>', type: InputFormat.RICH_TEXT_CK5 });
			});

			it('should return tasks that include the appropriate information of task with submission.', async () => {
				const { account: teacherAccount, course } = await setup();
				const student = userFactory.build();
				const task = taskFactory.build({ course });
				task.submissions.add(submissionFactory.submitted().build({ task, student }));
				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

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

			it('should retun a status flag in task if the teacher is only a substitution teacher.', async () => {
				const { account: teacherAccount, teacher } = await setup();
				const course = courseFactory.build({ substitutionTeachers: [teacher] });
				const task = taskFactory.build({ course });
				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

				expect(result.data[0].status.isSubstitutionTeacher).toEqual(true);
			});

			it('should return private tasks created by the user', async () => {
				const { account: teacherAccount, teacher, course } = await setup();
				const task = taskFactory.draft().build({ creator: teacher, course });
				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
				expect(result.data[0].status.isDraft).toEqual(true);
			});

			it('should not return private tasks created by other users', async () => {
				const { account: teacherAccount, teacher } = await setup();
				const otherUser = userFactory.build();
				const course = courseFactory.build({ teachers: [teacher, otherUser] });
				const task = taskFactory.draft().build({ creator: otherUser, course });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
			});

			it('should return unavailable tasks created by the user', async () => {
				const { account: teacherAccount, teacher, course } = await setup();
				const task = taskFactory.build({ creator: teacher, course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should not return unavailable tasks created by other users', async () => {
				const { account: teacherAccount, teacher } = await setup();
				const otherUser = userFactory.build();
				const course = courseFactory.build({ teachers: [teacher, otherUser] });
				const task = taskFactory.build({ creator: otherUser, course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, teacherAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
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
				return { account, teacher: user, course, task1, task2, task3 };
			};

			it('should return a list of tasks', async () => {
				const { account } = await setup();
				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;
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
				return { account, teacher: user, course1, course2, course3, task1, task2, task3 };
			};

			it('should return a list of tasks from multiple courses', async () => {
				const { account } = await setup();
				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;
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

				const { body } = await apiRequest.get(undefined, studentAccount);
				const result = body as TaskListResponse;
				expect(result.total).toEqual(0);
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

			it('should not return finished tasks for student', async () => {
				const { studentAccount } = await setup();
				const { body } = await apiRequest.get(undefined, studentAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should return tasks that include the appropriate information.', async () => {
				const { studentAccount } = await setup();

				const { body } = await apiRequest.get(undefined, studentAccount);
				const result = body as TaskListResponse;

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

			it('should return a list of tasks with additional tasks', async () => {
				const { studentAccount, course } = await setup();
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });

				await em.persistAndFlush([task2, task3]);
				em.clear();

				const { body } = await apiRequest.get(undefined, studentAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(3);
			});

			it('should not return finished tasks', async () => {
				const { studentAccount } = await setup();

				const { body } = await apiRequest.get(undefined, studentAccount);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
			});
		});

		describe('when user is student with read permission in course', () => {
			const setup = async () => {
				const { account, user } = createStudent();
				const course = courseFactory.build({ students: [user] });
				await em.persistAndFlush([account, user, course]);
				em.clear();
				return { account, student: user, course };
			};

			it('should return 200 when student open it', async () => {
				const { account } = await setup();

				const { statusCode } = await apiRequest.get(undefined, account);

				expect(statusCode).toEqual(200);
			});

			it('should return empty tasks when student open it', async () => {
				const { account } = await setup();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});

			it('should allow to modified pagination and set correct limit', async () => {
				const { account } = await setup();

				const { body } = await apiRequest.get(undefined, account, { limit: '100', skip: '100' });
				const result = body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 100, // maximum is 100
					skip: 100,
				});
			});

			it('should not allow to set modified pagination limit greater then 100', async () => {
				const { account } = await setup();

				const { statusCode } = await apiRequest.get(undefined, account, { limit: '1000', skip: '100' });

				expect(statusCode).toEqual(400);
			});

			it('should not return private tasks', async () => {
				const { account, course } = await setup();
				const task = taskFactory.build({ course, private: true });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
			});

			it('should not return a task of a course that has no lesson and is not published', async () => {
				const { account, course } = await setup();
				const task = taskFactory.build({ course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
			});

			it('should return a task of a course that has no lesson and is not limited', async () => {
				const { account, course } = await setup();

				// @ts-expect-error expected value null in db
				const task = taskFactory.build({ course, dueDate: null });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should return unavailable tasks created by the student', async () => {
				const { account, course, student } = await setup();
				const task = taskFactory.build({ creator: student, course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should not return unavailable tasks', async () => {
				const { account, course } = await setup();
				const task = taskFactory.build({ course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
			});

			it('should not return task of finished courses', async () => {
				const { account, student } = await setup();
				const untilDate = new Date(Date.now() - 60 * 1000);
				const course = courseFactory.build({ untilDate, students: [student] });
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;

				expect(result.total).toEqual(0);
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
				return { account, student: user, course1, course2, course3, task1, task2, task3 };
			};

			it('should return a list of tasks from multiple courses', async () => {
				const { account } = await setup();
				const { body } = await apiRequest.get(undefined, account);
				const result = body as TaskListResponse;
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

				const response = await apiRequest.get(undefined, student.account);
				const { data } = response.body as TaskListResponse;

				expect(response.statusCode).toBe(200);
				expect(data[0].id).toContain(task.id);
			});

			it('should finds all tasks as teacher (assignment does not change the result)', async () => {
				const { teacher } = await setup();

				const response = await apiRequest.get(undefined, teacher.account);

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

				const response = await apiRequest.get(undefined, notAssignedStudent.account);

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

				const response = await apiRequest.get(undefined, student.account);

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

				const response = await apiRequest.get(undefined, student.account);

				const { total } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(total).toBe(0);
			});
		});
	});

	describe('[GET] /finished', () => {
		describe('when task has student assigned to finished task', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const student = createStudent();
				const notAssignedStudent = createStudent();
				const course = courseFactory.build({
					teachers: [teacher.user],
					students: [student.user, notAssignedStudent.user],
				});
				const task = taskFactory.build({ course, users: [student.user], finished: [student.user] });

				await em.persistAndFlush([
					teacher.user,
					teacher.account,
					student.user,
					student.account,
					course,
					task,
					notAssignedStudent.account,
					notAssignedStudent.user,
				]);
				em.clear();

				return { student, task, teacher, course, notAssignedStudent };
			};

			it('should find finished tasks to which student is assigned ', async () => {
				const { student, task } = await setup();

				const response = await apiRequest.get('/finished', student.account);

				const { data } = response.body as TaskListResponse;
				expect(response.statusCode).toBe(200);
				expect(data[0].id).toContain(task.id);
			});

			it('student does not find finished tasks, if tasks have users assigned, but himself is not assigned', async () => {
				const { notAssignedStudent } = await setup();

				const response = await apiRequest.get('/finished', notAssignedStudent.account);

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

// TODO: REMOVE after refactoring
describe('Task Controller (API)2', () => {
	describe('As user with write permissions in courses', () => {
		let app: INestApplication;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;
		let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

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
				.overrideProvider(FilesStorageClientAdapterService)
				.useValue(createMock<FilesStorageClientAdapterService>())
				.compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			api = new API(app, '/tasks');
			filesStorageClientAdapterService = app.get(FilesStorageClientAdapterService);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3],
			});
			const user = userFactory.build({ roles });

			return user;
		};

		it('should finish own task', async () => {
			const teacher = setup();
			const task = taskFactory.build({ creator: teacher, finished: [] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/finish`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toEqual([teacher.id]);
		});

		it('should finish task created by another user', async () => {
			const teacher = setup();
			const course = courseFactory.build({
				teachers: [teacher],
			});
			const student = userFactory.build();
			const task = taskFactory.build({ creator: student, course, finished: [student] });

			await em.persistAndFlush([teacher, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/finish`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers().sort()).toEqual([student.id, teacher.id].sort());
		});

		it('should restore own task', async () => {
			const teacher = setup();
			const task = taskFactory.build({ creator: teacher, finished: [teacher] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/restore`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toHaveLength(0);
		});

		it('should restore task created by another user', async () => {
			const teacher = setup();
			const course = courseFactory.build({
				teachers: [teacher],
			});
			const student = userFactory.build();
			const task = taskFactory.build({ creator: student, course, finished: [student, teacher] });

			await em.persistAndFlush([teacher, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/restore`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toEqual([student.id]);
		});

		describe('revert published task', () => {
			it('should revert published own task', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course, private: false });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}/revertPublished`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(200);

				const foundTask = await em.findOne(Task, { id: task.id });
				expect(foundTask?.isDraft()).toEqual(true);
			});

			it('should revert published task by another user in course', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: student, course, private: false });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}/revertPublished`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(200);

				const foundTask = await em.findOne(Task, { id: task.id });
				expect(foundTask?.isDraft()).toEqual(true);
			});

			it('should throw 403 "Forbidden", if user(Student) has no permissions', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course, private: false });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(student);

				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}/revertPublished`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(403);
			});

			it('should throw 403 "Forbidden" for teacher, if task is not from my course', async () => {
				const teacherOne = setup();
				const teacherTwo = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacherOne],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacherOne, course, private: false });

				await em.persistAndFlush([teacherOne, teacherTwo, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacherTwo);

				await request(app.getHttpServer())
					.patch(`/tasks/${task.id}/revertPublished`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(403);
			});

			it('should throw 404 if wrong task ID', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course, private: false });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.patch(`/tasks/${new ObjectID().toHexString()}/revertPublished`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(404);
			});

			it('should throw 400 if task ID is invalid', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course, private: false });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const result = await request(app.getHttpServer())
					.patch('/tasks/string/revertPublished')
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(400);
				expect(result.body).toMatchObject({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					code: 400,
				});
			});
		});

		describe('delete task', () => {
			it('should delete task created by user', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.delete(`/tasks/${task.id}`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(200);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toBeCalled();

				const foundTask = await em.findOne(Task, { id: task.id });
				expect(foundTask).toEqual(null);
			});

			it('should throw 403 "Forbidden", if user(Student) has not permissions', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(student);

				await request(app.getHttpServer())
					.delete(`/tasks/${task.id}`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(403);
			});

			it('should throw 404 if wrong task ID', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.delete(`/tasks/${new ObjectID().toHexString()}`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(404);
			});

			it('should throw 400 if task ID is invalid', async () => {
				const teacher = setup();
				const student = userFactory.build();
				const course = courseFactory.build({
					teachers: [teacher],
					students: [student],
				});
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const r = await request(app.getHttpServer())
					.delete(`/tasks/string`)
					.set('Accept', 'application/json')
					.set('Authorization', 'jwt')
					.expect(400);
				expect(r.body).toMatchObject({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					code: 400,
				});
			});
		});

		describe('copy tasks', () => {
			it('should duplicate a task', async () => {
				const teacher = setup();
				const course = courseFactory.build({
					teachers: [teacher],
				});
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([teacher, task]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);
				const params = { courseId: course.id };

				const response = await request(app.getHttpServer())
					.post(`/tasks/${task.id}/copy`)
					.set('Authorization', 'jwt')
					.send(params);

				expect(response.status).toEqual(201);
			});

			it('should duplicate a task avoiding name collisions', async () => {
				const teacher = setup();
				const course = courseFactory.build({
					teachers: [teacher],
				});
				const originalTask = taskFactory.build({ creator: teacher, course, name: 'Addition' });
				const task2 = taskFactory.build({ creator: teacher, course, name: 'Addition (1)' });
				const task3 = taskFactory.build({ creator: teacher, course, name: 'Addition (3)' });

				await em.persistAndFlush([teacher, originalTask, task2, task3]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const result = await api.copyTask(originalTask.id, course.id);
				expect(result.status).toEqual(201);
				expect(result.copyStatus?.title).toEqual('Addition (2)');
			});

			it('should avoid name collisions when copying the same task twice', async () => {
				const teacher = setup();
				const course = courseFactory.build({
					teachers: [teacher],
				});
				const originalTask = taskFactory.build({ creator: teacher, course, name: 'Addition' });

				await em.persistAndFlush([teacher, course, originalTask]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const result1 = await api.copyTask(originalTask.id, course.id);
				expect(result1.status).toEqual(201);
				expect(result1.copyStatus?.title).toEqual('Addition (1)');

				const result2 = await api.copyTask(originalTask.id, course.id);
				expect(result2.status).toEqual(201);
				expect(result2.copyStatus?.title).toEqual('Addition (2)');
			});

			it('should avoid name collisions when copying the copy of a task', async () => {
				const teacher = setup();
				const course = courseFactory.build({
					teachers: [teacher],
				});
				const originalTask = taskFactory.build({ creator: teacher, course, name: 'Addition' });

				await em.persistAndFlush([teacher, course, originalTask]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacher);

				const result1 = await api.copyTask(originalTask.id, course.id);
				expect(result1.status).toEqual(201);
				expect(result1.copyStatus?.title).toEqual('Addition (1)');

				const result2 = await api.copyTask(result1.copyStatus.id, course.id);
				expect(result2.status).toEqual(201);
				expect(result2.copyStatus?.title).toEqual('Addition (2)');
			});
		});
	});

	describe('As user with read permissions in courses', () => {
		let app: INestApplication;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;

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
			api = new API(app, '/tasks');
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.TASK_DASHBOARD_VIEW_V3],
			});
			const user = userFactory.build({ roles });

			return user;
		};

		it('should finish own task', async () => {
			const student = setup();
			const task = taskFactory.build({ creator: student, finished: [] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/finish`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toEqual([student.id]);
		});

		it('should finish task created by another user', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const teacher = userFactory.build();
			const task = taskFactory.build({ creator: teacher, course, finished: [teacher] });

			await em.persistAndFlush([student, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/finish`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers().sort()).toEqual([student.id, teacher.id].sort());
		});

		it('should restore own task', async () => {
			const student = setup();
			const task = taskFactory.build({ creator: student, finished: [student] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/restore`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toHaveLength(0);
		});

		it('should finish task created by another user', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const teacher = userFactory.build();
			const task = taskFactory.build({ creator: teacher, course, finished: [teacher, student] });

			await em.persistAndFlush([student, task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);

			await request(app.getHttpServer())
				.patch(`/tasks/${task.id}/restore`)
				.set('Accept', 'application/json')
				.expect(200);

			const foundTask = await em.findOne(Task, { id: task.id });
			expect(foundTask?.finished.getIdentifiers()).toEqual([teacher.id]);
		});
	});
});
