import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@src/server.module';
import { CourseMetadataListResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { userFactory, courseFactory, cleanupCollections, roleFactory, mapUserToCurrentUser } from '@shared/testing';
import { ICurrentUser } from '@shared/domain';

describe('Course Controller (e2e)', () => {
	let app: INestApplication;
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
		em = app.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, { permissions: [] });
		const user = userFactory.build({ roles });

		return user;
	};

	it('[FIND] courses', async () => {
		const student = setup();
		const course = courseFactory.build({ name: 'course #1', students: [student] });
		await em.persistAndFlush(course);
		em.clear();

		currentUser = mapUserToCurrentUser(student);

		const response = await request(app.getHttpServer()).get('/courses');

		expect(response.status).toEqual(200);
		const body = response.body as CourseMetadataListResponse;
		expect(typeof body.data[0].title).toBe('string');
	});
});
