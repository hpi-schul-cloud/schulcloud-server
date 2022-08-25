import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import {
	userFactory,
	courseFactory,
	cleanupCollections,
	roleFactory,
	mapUserToCurrentUser,
	lessonFactory,
	taskFactory,
} from '@shared/testing';
import { ICurrentUser, Permission } from '@shared/domain';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';

Configuration.set('INCOMING_REQUEST_TIMEOUT_COPY_API', 1);
// eslint-disable-next-line import/first
import { ServerTestModule } from '@src/server.module';

describe('Copy timeout (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let configBefore: IConfig;

	beforeEach(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
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
		Configuration.reset(configBefore);
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, { permissions: [] });
		const user = userFactory.build({ roles });

		return user;
	};

	it('Course copy timeout', async () => {
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

	it('Task copy timeout', async () => {
		const teacher = setup();
		const course = courseFactory.build({ name: 'course #1', teachers: [teacher] });
		const task = taskFactory.build({ name: 'task #1', course });

		await em.persistAndFlush([task, course]);
		em.clear();

		currentUser = mapUserToCurrentUser(teacher);

		const response = await request(app.getHttpServer())
			.post(`/tasks/${task.id}/copy`)
			.set('Authorization', 'jwt')
			.send();

		expect(response.status).toEqual(408);
	});

	it('Lesson copy timeout', async () => {
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
