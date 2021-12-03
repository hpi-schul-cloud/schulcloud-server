import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerModule } from '@src/server.module';
import { CourseMetadataListResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { userFactory, courseFactory, cleanUpCollections, createCurrentTestUser } from '@shared/testing';
import { ICurrentUser, User } from '@shared/domain';

const modifyCurrentUserId = (currentUser: ICurrentUser, user: User) => {
	currentUser.user.id = user.id;
	currentUser.userId = user.id;
};

describe('Dashboard Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser; // FIXME currentuser may need an accountId
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
		em = app.get(EntityManager);
		currentUser = createCurrentTestUser().currentUser;
	});

	afterEach(async () => {
		await cleanUpCollections(em);
		await app.close();
		await orm.close();
	});

	it('[FIND] courses', async () => {
		const student = userFactory.build();
		await em.persistAndFlush([student]);
		const course = courseFactory.build({ name: 'course #1', students: [student] });
		await em.persistAndFlush(course);
		em.clear();

		modifyCurrentUserId(currentUser, student);

		const response = await request(app.getHttpServer()).get('/courses');

		expect(response.status).toEqual(200);
		const body = response.body as CourseMetadataListResponse;
		expect(typeof body.data[0].title).toBe('string');
	});
});
