import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@src/server.module';
import { BoardResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import {
	userFactory,
	courseFactory,
	taskFactory,
	cleanupCollections,
	roleFactory,
	mapUserToCurrentUser,
} from '@shared/testing';
import { ICurrentUser } from '@shared/domain';

describe('Rooms Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
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

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
		em = app.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await app.close();
		await orm.close();
	});

	it('[GET] board', async () => {
		const roles = roleFactory.buildList(1, { permissions: [] });
		const student = userFactory.build({ roles });
		const course = courseFactory.build({ students: [student] });
		const task = taskFactory.build({ course });

		await em.persistAndFlush([course, task]);
		em.clear();

		currentUser = mapUserToCurrentUser(student);

		const response = await request(app.getHttpServer()).get(`/rooms/${course.id}/board`);

		expect(response.status).toEqual(200);
		const body = response.body as BoardResponse;
		expect(body.roomId).toEqual(course.id);
	});
});
