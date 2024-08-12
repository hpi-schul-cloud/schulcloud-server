import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';

import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ResolvedUserResponse } from '@modules/user/controller/dto';
import { ApiValidationError } from '@shared/common';
import { LanguageType } from '@shared/domain/interface';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';

const baseRouteName = '/user/me';

class API {
	app: INestApplication;

	routeName: string;

	constructor(app: INestApplication, routeName: string) {
		this.app = app;
		this.routeName = routeName;
	}

	async me() {
		const response = await request(this.app.getHttpServer()).get(this.routeName).set('Accept', 'application/json');

		return {
			result: response.body as ResolvedUserResponse,
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
			const response = await api.me();

			expect(response.status).toEqual(403);
		});
	});

	describe('without bad request data', () => {});

	describe('without valid request data', () => {
		let app: INestApplication;
		let orm: MikroORM;
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
			orm = app.get(MikroORM);
			em = module.get(EntityManager);
			api = new API(app, baseRouteName);
		});

		afterAll(async () => {
			await orm.close();
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
			const response = await api.me();

			expect(response.status).toEqual(200);
		});

		it('should return ResolvedUserResponse.', async () => {
			const response = await api.me();

			expect(response.result.id).toEqual(currentUser.userId);
		});
	});
});
