import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM, EntityManager } from '@mikro-orm/core';

import { ICurrentUser } from '@shared/domain';
import { PaginationResponse } from '@shared/controller';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';
import { TaskTestHelper } from '@src/modules/task/utils';
import { LearnroomTestHelper, Course } from '@src/entities';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { Task, Submission, UserTaskInfo } from '@src/modules/task/entity';

const modifiedCurrentUserId = (currentUser: ICurrentUser, user: UserTaskInfo) => {
	currentUser.user.id = user.id;
	currentUser.userId = user.id;
};

describe('Task Controller (e2e)', () => {
	describe('without permissions', () => {
		let app: INestApplication;
		let orm: MikroORM;

		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						const { currentUser } = createCurrentTestUser([]);
						req.user = currentUser;
						return true;
					},
				})
				.compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			orm = app.get(MikroORM);
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		it('[FIND] /tasks/open', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open');
			expect(response.status).toEqual(401);
		});

		it('[FIND] /tasks/completed', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/completed');
			expect(response.status).toEqual(401);
		});
	});

	describe('As user with write permissions in parents', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;

		const { currentUser } = createCurrentTestUser(['TASK_DASHBOARD_TEACHER_VIEW_V3']);

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerModule],
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
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		beforeEach(async () => {
			await Promise.all([
				em.nativeDelete(Course, {}),
				em.nativeDelete(Task, {}),
				em.nativeDelete(Submission, {}),
				em.nativeDelete(UserTaskInfo, {}),
			]);
		});

		it('[FIND] /tasks/open can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open').set('Accept', 'application/json');

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks/open should allow to modified pagination and set correct limit', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open').query({ limit: 100, skip: 100 });

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks/open should allow to modified pagination limit greater then 100', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open').query({ limit: 1000, skip: 100 });

			expect(response.status).toEqual(400);
		});

		it('[FIND] /tasks/open return tasks that include the appropriate information.', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createTeacherCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(false);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /tasks/open return tasks that include the appropriate information.', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			const student = helper.getOtherUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createTeacherCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(false);
			const submission = helper.createSubmission(task, student);

			await em.persistAndFlush([task, parent, user, student, submission]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0].status).toEqual({
				submitted: 1,
				maxSubmissions: parent.getStudentsNumber(),
				graded: 0,
			});
		});

		it('[FIND] /tasks/open return a list of tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createTeacherCourse();
			const task1 = helper.createTask(parent.id);
			const task2 = helper.createTask(parent.id);
			const task3 = helper.createTask(parent.id);
			task1.changePrivate(false);
			task2.changePrivate(false);
			task3.changePrivate(false);

			await em.persistAndFlush([task1, task2, task3, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks/open return a list of tasks from multiple parents', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent1 = helperL.createTeacherCourse();
			const parent2 = helperL.createTeacherCourse();
			const parent3 = helperL.createTeacherCourse();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			// parent3 has no task
			task1.changePrivate(false);
			task2.changePrivate(false);

			await em.persistAndFlush([task1, task2, parent1, parent2, parent3, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks/open should not return private tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createTeacherCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(true);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks/open should nothing return from parent where the user has read permissions', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(false);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});
	});

	describe('As user with read permissions in parents', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;

		const { currentUser } = createCurrentTestUser(['TASK_DASHBOARD_VIEW_V3']);

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerModule],
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
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		beforeEach(async () => {
			await Promise.all([
				em.nativeDelete(Course, {}),
				em.nativeDelete(Task, {}),
				em.nativeDelete(Submission, {}),
				em.nativeDelete(UserTaskInfo, {}),
			]);
		});

		it('[FIND] /tasks/open can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open');
			expect(response.status).toEqual(200);
		});

		it('[FIND] /tasks/completed can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/completed');
			expect(response.status).toEqual(200);
		});

		it('[FIND] /tasks/open can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open');

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks/completed can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/completed');

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks/open should allow to modified pagination and set correct limit', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open').query({ limit: 100, skip: 100 });

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks/completed should allow to modified pagination and set correct limit', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/completed').query({ limit: 100, skip: 100 });

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks/open should allow to modified pagination limit greater then 100', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/open').query({ limit: 1000, skip: 100 });

			expect(response.status).toEqual(400);
		});

		it('[FIND] /tasks/completed should allow to modified pagination limit greater then 100', async () => {
			const response = await request(app.getHttpServer()).get('/tasks/completed').query({ limit: 1000, skip: 100 });

			expect(response.status).toEqual(400);
		});

		it('[FIND] /tasks/open return tasks that include the appropriate information.', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(false);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /tasks/completed return tasks that include the appropriate information.', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task = helper.createTask(parent.id);
			const submission = helper.createSubmission(task);
			task.changePrivate(false);

			await em.persistAndFlush([task, submission, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/completed');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /tasks/open return a list of tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task1 = helper.createTask(parent.id);
			const task2 = helper.createTask(parent.id);
			const task3 = helper.createTask(parent.id);
			task1.changePrivate(false);
			task2.changePrivate(false);
			task3.changePrivate(false);

			await em.persistAndFlush([task1, task2, task3, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks/completed return a list of tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task1 = helper.createTask(parent.id);
			const task2 = helper.createTask(parent.id);
			const task3 = helper.createTask(parent.id);
			task1.changePrivate(false);
			task2.changePrivate(false);
			task3.changePrivate(false);
			const submission1 = helper.createSubmission(task1);
			const submission2 = helper.createSubmission(task2);
			const submission3 = helper.createSubmission(task3);

			await em.persistAndFlush([task1, task2, task3, submission1, submission2, submission3, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/completed');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks/open return a list of tasks from multiple parents', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent1 = helperL.createStudentCourse();
			const parent2 = helperL.createStudentCourse();
			const parent3 = helperL.createStudentCourse();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			// parent3 has no task
			task1.changePrivate(false);
			task2.changePrivate(false);

			await em.persistAndFlush([task1, task2, parent1, parent2, parent3, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks/completed return a list of tasks from multiple parents', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent1 = helperL.createStudentCourse();
			const parent2 = helperL.createStudentCourse();
			const parent3 = helperL.createStudentCourse();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			// parent3 has no task
			task1.changePrivate(false);
			task2.changePrivate(false);
			const submission1 = helper.createSubmission(task1);
			const submission2 = helper.createSubmission(task2);

			await em.persistAndFlush([task1, task2, submission1, submission2, parent1, parent2, parent3, user]);

			const response = await request(app.getHttpServer()).get('/tasks/completed');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks/open should not return private tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(true);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks/completed should not return private tasks', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createStudentCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(true);
			const submission = helper.createSubmission(task);

			await em.persistAndFlush([task, submission, parent, user]);

			const response = await request(app.getHttpServer()).get('/tasks/completed');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks/open should nothing return from student where the user has write permissions', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent1 = helperL.createTeacherCourse();
			const parent2 = helperL.createSubstitutionCourse();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			task1.changePrivate(false);
			task2.changePrivate(false);

			await em.persistAndFlush([task1, task2, parent1, parent2, user]);

			const response = await request(app.getHttpServer()).get('/tasks/open');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});
	});
});
