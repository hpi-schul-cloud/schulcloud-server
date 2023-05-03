import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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

	describe('[GET] /courses/', () => {
		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
			const user = userFactory.build({ roles });

			return { user };
		};
		it('should find courses', async () => {
			const { user: student } = setup();
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

	describe('[GET] /courses/:id', () => {
		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
			const user = userFactory.build({ roles });
			const course = courseFactory.build({ name: 'course #1', teachers: [user] });
			return { user, course, roles };
		};
		it('should find course for teacher', async () => {
			const { user, course } = setup();

			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer()).get(`/courses/${course.id}`);

			expect(response.status).toEqual(200);
			expect(response.body).toBeDefined();
		});
		it('should throw if user is not teacher', async () => {
			const { user, roles } = setup();
			const unknownTeacher = userFactory.build({ roles });
			const course = courseFactory.build({ name: 'course #1', teachers: [unknownTeacher] });

			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer()).get(`/courses/${course.id}`).set('Accept', 'application/json').expect(500);
		});
		it('should throw if course is not found', async () => {
			const { user, course } = setup();
			const unknownId = new ObjectId().toHexString();

			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			await request(app.getHttpServer()).get(`/courses/${unknownId}`).set('Accept', 'application/json').expect(404);
		});
	});

	describe('[GET] /courses/:id/export', () => {
		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_EDIT] });
			const user = userFactory.build({ roles });

			return { user };
		};
		it('should find course export', async () => {
			if (!Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) return;
			const { user } = setup();
			const course = courseFactory.build({ name: 'course #1', students: [user] });
			await em.persistAndFlush(course);
			em.clear();
			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer()).get(`/courses/${course.id}/export`);

			expect(response.status).toEqual(200);
			expect(response.body).toBeDefined();
		});
	});
});
