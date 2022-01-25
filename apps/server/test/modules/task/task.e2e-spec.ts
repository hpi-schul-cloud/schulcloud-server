import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Request } from 'express';
import { EntityManager } from '@mikro-orm/mongodb';
import { MikroORM } from '@mikro-orm/core';

import { ICurrentUser } from '@shared/domain';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { TaskListResponse } from '@src/modules/task/controller/dto';
import {
	courseFactory,
	userFactory,
	taskFactory,
	submissionFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
} from '@shared/testing';
import { TaskDashBoardPermission } from '@src/modules/task/uc/task.authorization.service';
import { E2eTestApi } from '@shared/testing/e2e-test-api';

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
			.query(query || {});

		return {
			result: response.body as TaskListResponse,
			status: response.status,
		};
	}
}

describe('Task Controller (e2e)', () => {
	describe('without permissions', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let api: E2eTestApi<TaskListResponse>;

		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			orm = app.get(MikroORM);
			api = new E2eTestApi<TaskListResponse>(app, '/tasks');
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		it('[FIND] /tasks', async () => {
			const { status } = await api.get();
			expect(status).toEqual(401);
		});
	});

	describe('As user with write permissions in courses', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: E2eTestApi<TaskListResponse>;

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
			orm = app.get(MikroORM);
			em = module.get(EntityManager);
			api = new E2eTestApi<TaskListResponse>(app, '/tasks');
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [TaskDashBoardPermission.teacherDashboard] });
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
			const task = taskFactory.build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.data[0]).toBeDefined();
			expect(result.data[0]).toHaveProperty('status');
			expect(result.data[0]).toHaveProperty('displayColor');
			expect(result.data[0]).toHaveProperty('name');
			expect(result.data[0]).toHaveProperty('description');
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = setup();
			const student = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher] });
			const task = taskFactory.build({ course });
			task.submissions.add(submissionFactory.build({ task, student }));

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(teacher);
			const { result } = await api.get();

			expect(result.data[0]).toBeDefined();
			expect(result.data[0].status).toEqual({
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
				graded: 0,
				isDraft: false,
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
	});

	describe('As user with read permissions in courses', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: E2eTestApi<TaskListResponse>;

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
			orm = app.get(MikroORM);
			em = module.get(EntityManager);
			api = new E2eTestApi<TaskListResponse>(app, '/tasks');
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [TaskDashBoardPermission.studentDashboard] });
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
			task.submissions.add(submissionFactory.build({ task, student }));

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
	});
});
