import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { CardNode, ColumnNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(boardId: string, columnId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${boardId}/columns/${columnId}`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`column delete (api)`, () => {
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
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.build();

		const columnBoardNode = columnBoardNodeFactory.buildWithId();
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const siblingColumnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		await em.persistAndFlush([user, cardNode, columnNode, columnBoardNode, siblingColumnNode]);
		em.clear();

		return { user, cardNode, columnNode, columnBoardNode, siblingColumnNode };
	};

	describe('with valid user', () => {
		it('should return status 200', async () => {
			const { user, columnNode, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(columnBoardNode.id, columnNode.id);

			expect(response.status).toEqual(200);
		});

		it('should actually delete the column', async () => {
			const { user, columnNode, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnBoardNode.id, columnNode.id);

			await expect(em.findOneOrFail(ColumnNode, columnNode.id)).rejects.toThrow();
		});

		it('should actually delete cards of the column', async () => {
			const { user, cardNode, columnNode, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnBoardNode.id, columnNode.id);

			await expect(em.findOneOrFail(CardNode, cardNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, columnNode, columnBoardNode, siblingColumnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnBoardNode.id, columnNode.id);

			await expect(em.findOneOrFail(ColumnNode, columnNode.id)).rejects.toThrow();

			const siblingFromDb = await em.findOneOrFail(ColumnNode, siblingColumnNode.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
