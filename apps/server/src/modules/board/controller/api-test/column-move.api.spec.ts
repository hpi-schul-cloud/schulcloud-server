import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, userFactory } from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

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
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardEntityFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNodes = new Array(10)
			.fill(1)
			.map((_, i) => columnEntityFactory.withParent(columnBoardNode).build({ position: i }));
		const columnToMove = columnNodes[2];
		const cardNode = cardEntityFactory.withParent(columnToMove).build();

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
			const result = await em.findOneOrFail(BoardNodeEntity, columnToMove.id);

			expect(result.position).toEqual(5);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnToMove, columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.move(columnToMove.id, columnBoardNode.id, 5);

			expect(response.status).toEqual(403);
		});
	});
});
