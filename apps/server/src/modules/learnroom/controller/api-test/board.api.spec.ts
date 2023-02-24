import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoard, ICurrentUser } from '@shared/domain';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { cardSkeletonFactory } from '@shared/testing/factory/board-card-skeleton.factory';
import { columnFactory } from '@shared/testing/factory/board-column.factory';
import { columnBoardFactory } from '@shared/testing/factory/column-board.factory';
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

			const columns = [
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(3) }),
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(5) }),
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(2) }),
			];
			const board = columnBoardFactory.build({ columns });

			await em.persistAndFlush([user, board]);

			em.clear();
			currentUser = mapUserToCurrentUser(user);

			return { board };
		};

		it('should succeed', async () => {
			const { board } = await setup();

			const response = await request(app.getHttpServer()).get(`/boards/${board.id}`);

			expect(response.status).toEqual(200);
		});

		it('should return the board', async () => {
			const { board } = await setup();

			const response = await request(app.getHttpServer()).get(`/boards/${board.id}`);

			expect((response.body as ColumnBoard).id).toEqual(board.id);
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
