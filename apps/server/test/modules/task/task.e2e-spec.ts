import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM, EntityManager, Collection } from '@mikro-orm/core';

import { ICurrentUser, Course, Submission, Task, User } from '@shared/domain';
import { PaginationResponse } from '@shared/controller';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { courseFactory, userFactory } from '@shared/domain/factory';

const modifyCurrentUserId = (currentUser: ICurrentUser, user: User) => {
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

	describe('As user with write permissions in courses', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;

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
			currentUser = createCurrentTestUser(['TASK_DASHBOARD_TEACHER_VIEW_V3']).currentUser;
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
				em.nativeDelete(User, {}),
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
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const course = courseFactory.build({ teachers: [teacher] });
			const task = new Task({ name: 'task #1', private: false, course });
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
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const course = courseFactory.build({ teachers: [teacher] });
			const task = new Task({ name: 'task #1', private: false, course });
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
				maxSubmissions: course.getNumberOfStudents(),
				graded: 0,
				isDraft: false,
			});
		});

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const course = courseFactory.build({ teachers: [teacher] });
			const task1 = new Task({ name: 'task #1', private: false, course });
			const task2 = new Task({ name: 'task #2', private: false, course });
			const task3 = new Task({ name: 'task #3', private: false, course });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple courses', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const course1 = courseFactory.build({ name: 'course #1', teachers: [teacher] });
			const course2 = courseFactory.build({ name: 'course #2', teachers: [teacher] });
			const course3 = courseFactory.build({ name: 'course #3', teachers: [teacher] });
			const task1 = new Task({ name: 'task #1', private: false, course: course1 });
			const task2 = new Task({ name: 'task #2', private: false, course: course2 });

			await em.persistAndFlush([task1, task2, course3]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks should also return private tasks', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const course = courseFactory.build({ name: 'course #1', teachers: [teacher] });
			const task = new Task({ name: 'task #1', private: true, course });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(1);
			expect(paginatedResult.data[0].status.isDraft).toEqual(true);
		});

		it('[FIND] /tasks should return nothing from courses where the user has only read permissions', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			await em.persistAndFlush([teacher]);
			const course = courseFactory.build({ name: 'course #1', students: [teacher] });
			const task = new Task({ name: 'task #1', private: false, course });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, teacher);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});
	});

	describe('As user with read permissions in courses', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;

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
			currentUser = createCurrentTestUser(['TASK_DASHBOARD_VIEW_V3']).currentUser;
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
				em.nativeDelete(User, {}),
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
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const course = courseFactory.build({
				name: 'course #1',
				teachers: [teacher],
				students: [student],
			});
			const task = new Task({ name: 'task #1', private: false, course });
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
				isDraft: false,
			});
		});

		it('[FIND] /tasks return a list of tasks', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const course = courseFactory.build({
				name: 'course #1',
				teachers: [teacher],
				students: [student],
			});
			const task1 = new Task({ name: 'task #1', private: false, course });
			const task2 = new Task({ name: 'task #2', private: false, course });
			const task3 = new Task({ name: 'task #3', private: false, course });

			await em.persistAndFlush([task1, task2, task3]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(3);
		});

		it('[FIND] /tasks return a list of tasks from multiple courses', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const course1 = courseFactory.build({
				name: 'course #1',
				teachers: [teacher],
				students: [student],
			});
			const course2 = courseFactory.build({
				name: 'course #2',
				teachers: [teacher],
				students: [student],
			});
			const course3 = courseFactory.build({
				name: 'course #3',
				teachers: [teacher],
				students: [student],
			});
			const task1 = new Task({ name: 'task #1', private: false, course: course1 });
			const task2 = new Task({ name: 'task #2', private: false, course: course2 });

			await em.persistAndFlush([task1, task2, course3]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(2);
		});

		it('[FIND] /tasks should not return private tasks', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([teacher, student]);
			const course = courseFactory.build({
				name: 'course #1',
				teachers: [teacher],
				students: [student],
			});
			const task = new Task({ name: 'task #1', private: true, course });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('[FIND] /tasks should nothing return from student where the user has write permissions', async () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const subTeacher = userFactory.build({ firstName: 'Hanna', lastName: 'Heinrich' });
			await em.persistAndFlush([teacher, subTeacher]);
			const course1 = courseFactory.build({
				name: 'course #1',
				teachers: [teacher],
			});
			const course2 = courseFactory.build({
				name: 'course #2',
				substitutionTeachers: [subTeacher],
			});
			const task1 = new Task({ name: 'task #1', private: false, course: course1 });
			const task2 = new Task({ name: 'task #2', private: false, course: course2 });

			await em.persistAndFlush([task1, task2]);
			em.clear();

			// modifyCurrentUserId?

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('should not return a task of a course that has no lesson and is not published', async () => {
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([student]);

			const course = courseFactory.build({
				name: 'course #1',
				students: [student],
			});

			const nextDay = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
			const task = new Task({ name: 'task #1', private: true, course, availableDate: nextDay });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(0);
		});

		it('should return a task of a course that has no lesson and is not limited', async () => {
			const student = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			await em.persistAndFlush([student]);

			const course = courseFactory.build({
				name: 'course #1',
				students: [student],
			});

			// @ts-expect-error expected value null in db
			const task = new Task({ name: 'task #1', private: false, course, dueDate: null });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, student);

			const response = await request(app.getHttpServer()).get('/tasks');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.total).toEqual(1);
		});
	});
});
