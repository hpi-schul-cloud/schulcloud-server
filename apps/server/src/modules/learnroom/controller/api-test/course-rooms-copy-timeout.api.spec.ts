import { createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';

// config must be set outside before the server module is importat, otherwise the configuration is already set
const configBefore = Configuration.toObject({ plainSecrets: true });
Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
Configuration.set('INCOMING_REQUEST_TIMEOUT_COPY_API', 1);
// eslint-disable-next-line import/first
import { ServerTestModule } from '@modules/server';

// This needs to be in a separate test file because of the above configuration.
// When we find a way to mock the config, it should be moved alongside the other API tests.
describe('Course Rooms copy (API)', () => {
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
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
		Configuration.reset(configBefore);
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, { permissions: [Permission.COURSE_CREATE, Permission.TOPIC_CREATE] });
		const user = userFactory.build({ roles });

		return user;
	};

	it('should respond with 408 on timeout when copying course', async () => {
		const teacher = setup();
		const course = courseFactory.build({ name: 'course #1', teachers: [teacher] });
		await em.persistAndFlush(course);
		em.clear();

		currentUser = mapUserToCurrentUser(teacher);

		const response = await request(app.getHttpServer())
			.post(`/rooms/${course.id}/copy`)
			.set('Authorization', 'jwt')
			.send();

		expect(response.status).toEqual(408);
	});

	it('should respond with 408 on timeout when copying lesson', async () => {
		const teacher = setup();
		const course = courseFactory.build({ name: 'course #1', teachers: [teacher] });
		const lesson = lessonFactory.build({ name: 'lesson #1', course });
		await em.persistAndFlush([lesson, course]);
		em.clear();

		currentUser = mapUserToCurrentUser(teacher);

		const response = await request(app.getHttpServer())
			.post(`/rooms/lessons/${lesson.id}/copy`)
			.set('Authorization', 'jwt')
			.send();

		expect(response.status).toEqual(408);
	});
});
