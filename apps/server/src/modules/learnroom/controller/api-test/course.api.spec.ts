import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { CourseMetadataListResponse } from '@src/modules/learnroom/controller/dto';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

describe('Course Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
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

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
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

	it('[GET] course export', async () => {
		if (!Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) return;
		const user = setup();
		const course = courseFactory.build({ name: 'course #1', students: [user] });
		await em.persistAndFlush(course);
		em.clear();
		currentUser = mapUserToCurrentUser(user);

		const response = await request(app.getHttpServer()).get(`/courses/${course.id}/export`);

		expect(response.status).toEqual(200);
		expect(response.body).toBeDefined();
	});

	it('[GET] course for teacher', async () => {
		const user = setup();
		const course = courseFactory.build({ name: 'course #1', teachers: [user] });
		await em.persistAndFlush(course);
		em.clear();
		currentUser = mapUserToCurrentUser(user);

		const response = await request(app.getHttpServer()).get(`/courses/${course.id}`);

		expect(response.status).toEqual(200);
		expect(response.body).toBeDefined();
	});
});
