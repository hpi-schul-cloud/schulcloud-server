import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { EntityManager } from '@mikro-orm/mongodb';

import { ServerTestModule } from '@src/modules/server/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser, User, LanguageType } from '@shared/domain';
import { ApiValidationError } from '@shared/common';
import { userFactory, cleanupCollections, mapUserToCurrentUser, roleFactory } from '@shared/testing';

const baseRouteName = '/user/language';

class API {
	app: INestApplication;

	routeName: string;

	constructor(app: INestApplication, routeName: string) {
		this.app = app;
		this.routeName = routeName;
	}

	async patch(language: string) {
		const response = await request(this.app.getHttpServer())
			.patch(`${this.routeName}`)
			.set('Accept', 'application/json')
			.send({ language });

		return {
			result: response.body as boolean,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(baseRouteName, () => {
	describe('with user is not logged in', () => {
		let app: INestApplication;
		let em: EntityManager;
		let api: API;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate() {
						return false;
					},
				})
				.compile();

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			api = new API(app, baseRouteName);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);

			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });

			await em.persistAndFlush([user]);
			em.clear();
		});

		it('should return status 403', async () => {
			const response = await api.patch(LanguageType.DE);

			expect(response.status).toEqual(403);
		});
	});

	describe('with bad request data', () => {
		let app: INestApplication;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
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

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			api = new API(app, baseRouteName);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);

			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
		});

		it('should throw an validation error is not supported language is passed.', async () => {
			const response = await api.patch('super');

			expect(response.error.validationErrors).toEqual([
				{
					errors: ['language must be a valid enum value'],
					field: 'language',
				},
			]);
		});
	});

	describe('without valid request data', () => {
		let app: INestApplication;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
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

			app = module.createNestApplication();
			await app.init();
			em = module.get(EntityManager);
			api = new API(app, baseRouteName);
		});

		afterAll(async () => {
			await app.close();
		});

		beforeEach(async () => {
			await cleanupCollections(em);

			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles, language: LanguageType.DE });

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
		});

		it('should return status 200 for successful request.', async () => {
			const response = await api.patch(LanguageType.EN);

			expect(response.status).toEqual(200);
		});

		it('should return successful true.', async () => {
			const response = await api.patch(LanguageType.EN);

			expect(response.result).toEqual({ successful: true });
		});

		it('should change the language', async () => {
			await api.patch(LanguageType.EN);

			const user = await em.findOne(User, { id: currentUser.userId });

			expect(user?.language).toEqual('en');
		});

		it('should support de, en, es, ua', async () => {
			const de = await api.patch(LanguageType.DE);
			const en = await api.patch(LanguageType.EN);
			const es = await api.patch(LanguageType.ES);
			const ua = await api.patch(LanguageType.UA);

			expect(de.status).toEqual(200);
			expect(en.status).toEqual(200);
			expect(es.status).toEqual(200);
			expect(ua.status).toEqual(200);
		});
	});
});
