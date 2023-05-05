import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { ColumnNode } from '@shared/domain';
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

const baseRouteName = '/columns';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async move(columnId: string, toBoardId: string, toPosition: number) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}/${columnId}/position`)
			.set('Accept', 'application/json')
			.send({ toBoardId, toPosition });

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`column move (api)`, () => {
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
		const columnNodes = new Array(10)
			.fill(1)
			.map((o, i) => columnNodeFactory.buildWithId({ parent: columnBoardNode, position: i }));
		const columnToMove = columnNodes[2];
		const cardNode = cardNodeFactory.buildWithId({ parent: columnToMove });

		await em.persistAndFlush([user, cardNode, ...columnNodes, columnBoardNode]);
		em.clear();

		return { user, cardNode, columnToMove, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, columnToMove, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.move(columnToMove.id, columnBoardNode.id, 5);

			expect(response.status).toEqual(204);
		});

		it('should actually move the column', async () => {
			const { user, columnToMove, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.move(columnToMove.id, columnBoardNode.id, 5);
			const result = await em.findOneOrFail(ColumnNode, columnToMove.id);

			expect(result.position).toEqual(5);
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
