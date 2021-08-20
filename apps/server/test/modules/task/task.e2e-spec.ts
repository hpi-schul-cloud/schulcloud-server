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
import { LearnroomTestHelper } from '@src/modules/learnroom/utils/testHelper';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { Course } from '@src/modules/learnroom/entity';
import { Task, Submission, UserTaskInfo } from '@src/modules/task/entity';

// 		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',

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

		it('[FIND] /task/dashboard', async () => {
			const response = await request(app.getHttpServer()).get('/task/dashboard');
			expect(response.status).toEqual(401);
		});
	});

	describe('as user with write permissions in parents', () => {
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

		it('[FIND] /task/dashboard can open it', async () => {
			const response = await request(app.getHttpServer()).get('/task/dashboard');
			expect(response.status).toEqual(200);
		});
		// remove data?
		it('[FIND] /task/dashboard return tasks that include the appropriate information.', async () => {
			const helperL = new LearnroomTestHelper();
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as UserTaskInfo;
			modifiedCurrentUserId(currentUser, user);
			helperL.createAndAddUser(user);

			const parent = helperL.createTeacherCourse();
			const task = helper.createTask(parent.id);
			task.changePrivate(false);

			await em.persistAndFlush([task, parent, user]);

			const response = await request(app.getHttpServer()).get('/task/dashboard');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('displayColor');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /task/dashboard return a list of', async () => {});

		// write test for pagination
	});

	describe('as user with read permissions in parents', () => {});
});
