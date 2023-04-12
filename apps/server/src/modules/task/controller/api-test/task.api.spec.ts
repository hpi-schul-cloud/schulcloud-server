import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, InputFormat, Lesson, Permission, Task, User } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	submissionFactory,
	taskFactory,
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

describe('Task Controller (API)', () => {
	describe('without permissions', () => {
		let app: INestApplication;
		let api: API;

		const setConfig = () => {
			Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
		};

		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			api = new API(app, '/tasks');
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(() => {
			setConfig();
		});

		it('[FIND] /tasks', async () => {
			const { status } = await api.get();
			expect(status).toEqual(401);
		});
	});

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

		it('[FIND] /tasks can open it', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks should allow to modified pagination and set correct limit', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get({ limit: 100, skip: 100 });

			expect(result).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks should allow to modified pagination limit greater then 100', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { status } = await api.get({ limit: 1000, skip: 100 });

			expect(status).toEqual(400);
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const user = setup();
			const course = courseFactory.build({ teachers: [user] });
			const task = taskFactory.build({
				course,
				description: '<p>test</p>',
				descriptionInputFormat: InputFormat.RICH_TEXT_CK5,
			});

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.data[0]).toBeDefined();
			expect(result.data[0]).toHaveProperty('status');
			expect(result.data[0]).toHaveProperty('displayColor');
			expect(result.data[0]).toHaveProperty('name');
			expect(result.data[0]).toHaveProperty('description');
			expect(result.data[0].description).toEqual({ content: '<p>test</p>', type: InputFormat.RICH_TEXT_CK5 });
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = setup();
			const student = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher] });
			const task = taskFactory.build({ course });
			task.submissions.add(submissionFactory.submitted().build({ task, student }));

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

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

		it('[FIND] /tasks retun a status flag in task if the teacher is only a substitution teacher.', async () => {
			const teacher = setup();
			const course = courseFactory.build({ substitutionTeachers: [teacher] });
			const task = taskFactory.build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.data[0].status.isSubstitutionTeacher).toEqual(true);
		});

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = setup();
			const course = courseFactory.build({ teachers: [teacher] });
			const task1 = taskFactory.build({ course });
			const task2 = taskFactory.build({ course });
			const task3 = taskFactory.build({ course });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple courses', async () => {
			const teacher = setup();
			const course1 = courseFactory.build({ teachers: [teacher] });
			const course2 = courseFactory.build({ teachers: [teacher] });
			const course3 = courseFactory.build({ teachers: [teacher] });
			const task1 = taskFactory.build({ course: course1 });
			const task2 = taskFactory.build({ course: course2 });

			await em.persistAndFlush([task1, task2, course3]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(2);
		});

		it('[FIND] /tasks should also return private tasks created by the user', async () => {
			const teacher = setup();
			const course = courseFactory.build({ teachers: [teacher] });
			const task = taskFactory.draft().build({ creator: teacher, course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(1);
			expect(result.data[0].status.isDraft).toEqual(true);
		});

		it('[FIND] /tasks should not return private tasks created by other users', async () => {
			const teacher = setup();
			const otherUser = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher, otherUser] });
			const task = taskFactory.draft().build({ creator: otherUser, course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should return unavailable tasks created by the user', async () => {
			const user = setup();
			const course = courseFactory.build({
				teachers: [user],
			});
			const task = taskFactory.build({ creator: user, course, availableDate: tomorrow });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.total).toEqual(1);
		});

		it('should not return unavailable tasks created by other users', async () => {
			const teacher = setup();
			const otherUser = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher, otherUser] });
			const task = taskFactory.build({ creator: otherUser, course, availableDate: tomorrow });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('[FIND] /tasks should return nothing from courses when the user has only read permissions', async () => {
			const teacher = setup();
			const course = courseFactory.build({ students: [teacher] });
			const task = taskFactory.build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should not return finished tasks', async () => {
			const teacher = setup();
			const course = courseFactory.build({
				teachers: [teacher],
			});
			const task = taskFactory.build({ course, finished: [teacher] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

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

		it('[FIND] /tasks can open it', async () => {
			const student = setup();

			await em.persistAndFlush([student]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { status } = await api.get();

			expect(status).toEqual(200);
		});

		it('[FIND] /tasks can open it', async () => {
			const student = setup();

			await em.persistAndFlush([student]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks should allow to modified pagination and set correct limit', async () => {
			const student = setup();

			await em.persistAndFlush([student]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get({ limit: 100, skip: 100 });

			expect(result).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks should allow to modified pagination limit greater then 100', async () => {
			const student = setup();

			await em.persistAndFlush([student]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { status } = await api.get({ limit: 1000, skip: 100 });

			expect(status).toEqual(400);
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = userFactory.build();
			const student = setup();
			const course = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const task = taskFactory.build({ course });
			task.submissions.add(submissionFactory.submitted().build({ task, student }));

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

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

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = userFactory.build();
			const student = setup();
			const course = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const task1 = taskFactory.build({ course });
			const task2 = taskFactory.build({ course });
			const task3 = taskFactory.build({ course });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple courses', async () => {
			const teacher = userFactory.build();
			const student = setup();
			const course1 = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const course2 = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const course3 = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const task1 = taskFactory.build({ course: course1 });
			const task2 = taskFactory.build({ course: course2 });

			await em.persistAndFlush([task1, task2, course3]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(2);
		});

		it('[FIND] /tasks should not return private tasks', async () => {
			const teacher = userFactory.build();
			const student = setup();
			const course = courseFactory.build({
				teachers: [teacher],
				students: [student],
			});
			const task = taskFactory.build({ course, private: true });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should not return a task of a course that has no lesson and is not published', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const task = taskFactory.build({ course, availableDate: tomorrow });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should return a task of a course that has no lesson and is not limited', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			// @ts-expect-error expected value null in db
			const task = taskFactory.build({ course, dueDate: null });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(1);
		});

		it('should not return finished tasks', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const task = taskFactory.build({ course, finished: [student] });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should return unavailable tasks created by the user', async () => {
			const user = setup();
			const course = courseFactory.build({
				students: [user],
			});
			const task = taskFactory.build({ creator: user, course, availableDate: tomorrow });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.total).toEqual(1);
		});

		it('should not return unavailable tasks', async () => {
			const student = setup();
			const course = courseFactory.build({
				students: [student],
			});
			const task = taskFactory.build({ course, availableDate: tomorrow });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should not return task of finished courses', async () => {
			const untilDate = new Date(Date.now() - 60 * 1000);
			const student = setup();
			const course = courseFactory.build({ untilDate, students: [student] });
			const task = taskFactory.build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(student);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

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

	describe('When task-card feature is enabled', () => {
		let app: INestApplication;
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
			expect(responseTask.duedate).toEqual(updateTaskParams.dueDate);
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

	describe('When task-card feature is not enabled', () => {
		let app: INestApplication;
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

	describe('Multiple users filtered by assignment', () => {
		let app: INestApplication;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let entities: {
			teacher1: User;
			teacher2: User;
			student1: User;
			student2: User;
			student3: User;
			student4: User;
			englishCourse: Course;
			grammerLesson: Lesson;
			historyCourse: Course;
			mathsCourse: Course;
			algebraLesson: Lesson;
			englishTask1: Task;
			englishTask2: Task;
			englishTask3: Task;
			englishTask4: Task;
			historyTask1: Task;
			historyTask2: Task;
			historyTask3: Task;
			mathsTask1: Task;
			mathsTask2: Task;
			mathsTask3: Task;
		};

		const createStudent = (id: number) => {
			const studentRole = roleFactory.build({
				permissions: [Permission.TASK_CARD_VIEW, Permission.TASK_DASHBOARD_VIEW_V3, Permission.HOMEWORK_VIEW],
			});

			const student = userFactory.build({
				firstName: `Student ${id}`,
				roles: [studentRole],
			});

			return student;
		};

		const createTeacher = (id: number) => {
			const teacherRole = roleFactory.build({
				permissions: [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3],
			});

			const student = userFactory.build({
				firstName: `Teacher ${id}`,
				roles: [teacherRole],
			});

			return student;
		};

		const setup = () => {
			const teachers = [1, 2].map(createTeacher);
			const [teacher1, teacher2] = teachers;
			const students = [1, 2, 3, 4].map(createStudent);
			const [student1, student2, student3, student4] = students;
			const englishCourse = courseFactory.build({
				name: 'english',
				teachers,
				students: [student1, student2, student3],
			});
			const grammerLesson = lessonFactory.build({
				name: 'grammer',
				course: englishCourse,
			});
			const historyCourse = courseFactory.build({
				name: 'history',
				teachers: [teacher1],
				students: [student1, student2, student3],
			});
			const mathsCourse = courseFactory.build({
				name: 'maths',
				teachers: [teacher2],
				students: [student1, student2],
			});
			const algebraLesson = lessonFactory.build({
				name: 'maths',
				course: mathsCourse,
			});

			// create tasks
			const englishTask1 = taskFactory.build({
				name: 'Write an essay',
				course: englishCourse,
				users: [student1, student2],
				creator: teacher1,
				finished: [student1],
			});
			const englishTask2 = taskFactory.build({
				name: 'grammer1',
				creator: teacher1,
				lesson: grammerLesson,
				users: [student1],
				finished: [student1],
			});
			const englishTask3 = taskFactory.build({
				name: 'grammer2',
				creator: teacher1,
				lesson: grammerLesson,
				users: [],
			});
			const englishTask4 = taskFactory.build({
				name: 'grammer3',
				creator: teacher1,
				lesson: grammerLesson,
			});

			const historyTask1 = taskFactory.build({
				name: 'cause of ww2',
				course: historyCourse,
				users: [student1, student2],
			});

			const historyTask2 = taskFactory.build({
				name: 'fall of Rome',
				course: historyCourse,
				users: [student2, student3],
				finished: [student2, student3],
			});

			const historyTask3 = taskFactory.build({
				name: 'DDR culture',
				course: historyCourse,
			});

			const mathsTask1 = taskFactory.build({
				name: 'textbook page 12',
				course: mathsCourse,
				users: [student2],
			});

			const mathsTask2 = taskFactory.build({
				name: 'all primes under million',
				course: mathsCourse,
				users: [student3],
			});

			const mathsTask3 = taskFactory.build({
				name: 'algebra 1',
				lesson: algebraLesson,
				users: [student2],
			});

			return {
				teacher1,
				teacher2,
				student1,
				student2,
				student3,
				student4,
				englishCourse,
				grammerLesson,
				historyCourse,
				mathsCourse,
				algebraLesson,
				englishTask1,
				englishTask2,
				englishTask3,
				englishTask4,
				historyTask1,
				historyTask2,
				historyTask3,
				mathsTask1,
				mathsTask2,
				mathsTask3,
			};
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
			Configuration.set('FEATURE_TASK_CARD_ENABLED', false);

			entities = setup();

			await em.persistAndFlush(Object.values(entities));
			em.clear();
		});

		it('students1 gets their tasks', async () => {
			currentUser = mapUserToCurrentUser(entities.student1);
			const response = await request(app.getHttpServer()).get(`/tasks`).set('Accept', 'application/json').send();
			const { total } = response.body as TaskListResponse;
			expect(response.status).toBe(200);
			expect(total).toBe(3);
		});

		it('students1 gets their tasks finished tasks', async () => {
			currentUser = mapUserToCurrentUser(entities.student1);
			const response = await request(app.getHttpServer())
				.get(`/tasks/finished`)
				.set('Accept', 'application/json')
				.send();
			const { total } = response.body as TaskListResponse;
			expect(response.status).toBe(200);
			expect(total).toBe(2);
		});

		it('students2 gets their tasks', async () => {
			currentUser = mapUserToCurrentUser(entities.student2);
			const response = await request(app.getHttpServer()).get(`/tasks`).set('Accept', 'application/json').send();
			const { total } = response.body as TaskListResponse;
			expect(response.status).toBe(200);
			expect(total).toBe(6);
		});

		it('students3 gets their tasks', async () => {
			currentUser = mapUserToCurrentUser(entities.student3);
			const response = await request(app.getHttpServer()).get(`/tasks`).set('Accept', 'application/json').send();
			const { total } = response.body as TaskListResponse;
			expect(response.status).toBe(200);
			expect(total).toBe(2);
		});

		it('teacher2 gets their tasks, assignment does not change the result', async () => {
			currentUser = mapUserToCurrentUser(entities.teacher2);
			const response = await request(app.getHttpServer()).get(`/tasks`).set('Accept', 'application/json').send();
			const { total } = response.body as TaskListResponse;
			expect(response.status).toBe(200);
			expect(total).toBe(7);
		});
	});
});
