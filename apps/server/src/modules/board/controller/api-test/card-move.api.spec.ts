import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType, CardNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

const baseRouteName = '/cards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async move(cardId: string, toColumnId: string, toPosition: number) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}/${cardId}/position`)
			.set('Accept', 'application/json')
			.send({ toColumnId, toPosition });

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`card move (api)`, () => {
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

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const parentColumn = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode1 = cardNodeFactory.buildWithId({ parent: parentColumn });
		const cardNode2 = cardNodeFactory.buildWithId({ parent: parentColumn });
		const targetColumn = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const targetColumnCards = cardNodeFactory.buildListWithId(4, { parent: targetColumn });

		await em.persistAndFlush([
			user,
			cardNode1,
			cardNode2,
			parentColumn,
			targetColumn,
			columnBoardNode,
			...targetColumnCards,
		]);
		em.clear();

		return { user, cardNode1, cardNode2, parentColumn, targetColumn, columnBoardNode, targetColumnCards };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, cardNode1, targetColumn } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.move(cardNode1.id, targetColumn.id, 3);

			expect(response.status).toEqual(204);
		});

		it('should actually move the card', async () => {
			const { user, cardNode1, targetColumn } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.move(cardNode1.id, targetColumn.id, 3);
			const result = await em.findOneOrFail(CardNode, cardNode1.id);

			expect(result.parentId).toEqual(targetColumn.id);
			expect(result.position).toEqual(3);
		});

		describe('when moving a card within the same column', () => {
			it('should keep the card parent', async () => {
				const { user, cardNode2, parentColumn } = await setup();
				currentUser = mapUserToCurrentUser(user);

				await api.move(cardNode2.id, parentColumn.id, 0);

				const result = await em.findOneOrFail(CardNode, cardNode2.id);
				expect(result.parentId).toEqual(parentColumn.id);
			});

			it('should update the card positions', async () => {
				const { user, cardNode1, cardNode2, parentColumn } = await setup();
				currentUser = mapUserToCurrentUser(user);

				await api.move(cardNode2.id, parentColumn.id, 0);

				const result1 = await em.findOneOrFail(CardNode, cardNode1.id);
				const result2 = await em.findOneOrFail(CardNode, cardNode2.id);
				expect(result1.position).toEqual(1);
				expect(result2.position).toEqual(0);
			});
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { cardNode1, targetColumn } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.move(cardNode1.id, targetColumn.id, 3);

			expect(response.status).toEqual(403);
		});
	});
});
