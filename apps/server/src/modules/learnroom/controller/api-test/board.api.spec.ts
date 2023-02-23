import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

describe('Boards Controller (API)', () => {
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

	describe('[GET] board', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			await em.persistAndFlush([user]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);
			const boardId = new ObjectId();

			return { boardId };
		};

		it('should return mock', async () => {
			const { boardId } = await setup();

			const response = await request(app.getHttpServer()).get(`/boards/${boardId.toString()}`);

			expect(response.status).toEqual(200);
		});
	});

	describe('[PATCH] move card', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			await em.persistAndFlush([user]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);
			const boardId = new ObjectId().toString();
			const cardId = new ObjectId().toString();

			return { boardId, cardId };
		};

		it('should not be implemented', async () => {
			const { boardId, cardId } = await setup();
			const body = {
				toColumnId: new ObjectId(),
				toIndex: 0,
			};

			const response = await request(app.getHttpServer()).put(`/boards/${boardId}/cards/${cardId}/position`).send(body);

			expect(response.status).toEqual(501);
		});
	});

	describe('[PATCH] move column', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			await em.persistAndFlush([user]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);
			const boardId = new ObjectId().toString();
			const columnId = new ObjectId().toString();

			return { boardId, columnId };
		};

		it('should not be implemented', async () => {
			const { boardId, columnId } = await setup();
			const body = {
				toIndex: 0,
			};

			const response = await request(app.getHttpServer())
				.put(`/boards/${boardId}/columns/${columnId}/position`)
				.send(body);

			expect(response.status).toEqual(501);
		});
	});

	describe('[PATCH] rename board', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			await em.persistAndFlush([user]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);
			const boardId = new ObjectId().toString();

			return { boardId };
		};

		it('should not be implemented', async () => {
			const { boardId } = await setup();
			const body = {
				title: 'this is a new title',
			};

			const response = await request(app.getHttpServer()).put(`/boards/${boardId}/title`).send(body);

			expect(response.status).toEqual(501);
		});
	});

	describe('[PATCH] rename column', () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			await em.persistAndFlush([user]);
			em.clear();
			currentUser = mapUserToCurrentUser(user);
			const boardId = new ObjectId().toString();
			const columnId = new ObjectId().toString();

			return { boardId, columnId };
		};

		it('should not be implemented', async () => {
			const { boardId, columnId } = await setup();
			const body = {
				title: 'this is a new title',
			};

			const response = await request(app.getHttpServer())
				.put(`/boards/${boardId.toString()}/columns/${columnId}/title`)
				.send(body);

			expect(response.status).toEqual(501);
		});
	});
});
