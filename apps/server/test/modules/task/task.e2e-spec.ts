import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM, EntityManager, Collection } from '@mikro-orm/core';

import { ICurrentUser, Course } from '@shared/domain';
import { PaginationResponse } from '@shared/controller';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { Task, Submission, UserTaskInfo } from '@src/modules/task/entity';
import { ObjectId } from '@mikro-orm/mongodb';

const modifyCurrentUserId = (currentUser: ICurrentUser, user: UserTaskInfo) => {
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

		it('[FIND] /tasks', async () => {
			const response = await request(app.getHttpServer()).get('/tasks');
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

		it('[FIND] /tasks can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks').set('Accept', 'application/json');

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks should allow to modified pagination and set correct limit', async () => {
			const response = await request(app.getHttpServer()).get('/tasks').query({ limit: 100, skip: 100 });

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks should allow to modified pagination limit greater then 100', async () => {
			const response = await request(app.getHttpServer()).get('/tasks').query({ limit: 1000, skip: 100 });

			expect(response.status).toEqual(400);
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const parent = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const task = new Task({ name: 'task #1', private: false, parent });
			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const student = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const parent = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const task = new Task({ name: 'task #1', private: false, parent });
			const submission = new Submission({ student, comment: '', task });
			task.submissions = new Collection<Submission>(task, [submission]);

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0].status).toEqual({
				submitted: 1,
				maxSubmissions: parent.getNumberOfStudents(),
				graded: 0,
			});
		});

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const parent = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const task1 = new Task({ name: 'task #1', private: false, parent });
			const task2 = new Task({ name: 'task #2', private: false, parent });
			const task3 = new Task({ name: 'task #3', private: false, parent });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple parents', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const parent1 = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const parent2 = new Course({ name: 'course #2', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const parent3 = new Course({ name: 'course #3', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const task1 = new Task({ name: 'task #1', private: false, parent: parent1 });
			const task2 = new Task({ name: 'task #2', private: false, parent: parent2 });

			await em.persistAndFlush([task1, task2, parent3]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks should not return private tasks', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const parent = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const task = new Task({ name: 'task #1', private: true, parent });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks should return nothing from parents where the user has only read permissions', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const parent = new Course({ name: 'course #1', schoolId: new ObjectId(), studentIds: [teacher._id] });
			const task = new Task({ name: 'task #1', private: false, parent });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
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

		it('[FIND] /tasks can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks');
			expect(response.status).toEqual(200);
		});

		it('[FIND] /tasks can open it', async () => {
			const response = await request(app.getHttpServer()).get('/tasks');

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 10,
				skip: 0,
			});
		});

		it('[FIND] /tasks should allow to modified pagination and set correct limit', async () => {
			const response = await request(app.getHttpServer()).get('/tasks').query({ limit: 100, skip: 100 });

			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult).toEqual({
				total: 0,
				data: [],
				limit: 100, // maximum is 100
				skip: 100,
			});
		});

		it('[FIND] /tasks should allow to modified pagination limit greater then 100', async () => {
			const response = await request(app.getHttpServer()).get('/tasks').query({ limit: 1000, skip: 100 });

			expect(response.status).toEqual(400);
		});

		it('[FIND] /tasks return tasks that include the appropriate information.', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const student = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const parent = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const task = new Task({ name: 'task #1', private: false, parent });
			const submission = new Submission({ student, comment: '', task });
			task.submissions = new Collection<Submission>(task, [submission]);

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
			expect(paginatedResult.data[0].status).toEqual({
				submitted: 1,
				maxSubmissions: 1,
				graded: 0,
			});
		});

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const student = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const parent = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const task1 = new Task({ name: 'task #1', private: false, parent });
			const task2 = new Task({ name: 'task #2', private: false, parent });
			const task3 = new Task({ name: 'task #3', private: false, parent });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple parents', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const student = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const parent1 = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const parent2 = new Course({
				name: 'course #2',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const parent3 = new Course({
				name: 'course #3',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const task1 = new Task({ name: 'task #1', private: false, parent: parent1 });
			const task2 = new Task({ name: 'task #2', private: false, parent: parent2 });

			await em.persistAndFlush([task1, task2, parent3]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks should not return private tasks', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const student = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const parent = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
				studentIds: [student._id],
			});
			const task = new Task({ name: 'task #1', private: true, parent });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks should nothing return from student where the user has write permissions', async () => {
			const teacher = new UserTaskInfo({ firstName: 'Carl', lastName: 'Cord' });
			const subTeacher = new UserTaskInfo({ firstName: 'Hanna', lastName: 'Heinrich' });
			await em.persistAndFlush([teacher, subTeacher]);
			const parent1 = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				teacherIds: [teacher._id],
			});
			const parent2 = new Course({
				name: 'course #2',
				schoolId: new ObjectId(),
				substitutionTeacherIds: [subTeacher._id],
			});
			const task1 = new Task({ name: 'task #1', private: false, parent: parent1 });
			const task2 = new Task({ name: 'task #2', private: false, parent: parent2 });

			await em.persistAndFlush([task1, task2]);
			em.clear();

			// modifyCurrentUserId?

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});
	});
});
