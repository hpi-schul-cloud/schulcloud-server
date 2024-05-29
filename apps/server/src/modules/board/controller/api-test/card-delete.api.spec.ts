import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { CardNode, RichTextElementNode } from '@shared/domain/entity';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, userFactory } from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { cardFactory, columnBoardFactory, columnFactory, richTextElementFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/cards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(cardId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${cardId}`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`card delete (api)`, () => {
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

		const columnBoardNode = columnBoardFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardFactory.buildWithId({ parent: columnNode });
		const richTextElementNode = richTextElementFactory.buildWithId({ parent: cardNode });
		const siblingCardNode = cardFactory.buildWithId({ parent: columnNode });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, siblingCardNode, richTextElementNode]);
		em.clear();

		return { user, cardNode, columnBoardNode, columnNode, siblingCardNode, richTextElementNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(cardNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete card', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(cardNode.id);

			await expect(em.findOneOrFail(CardNode, cardNode.id)).rejects.toThrow();
		});

		it('should actually delete elements of the card', async () => {
			const { user, cardNode, richTextElementNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(cardNode.id);

			await expect(em.findOneOrFail(RichTextElementNode, richTextElementNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, cardNode, siblingCardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(cardNode.id);

			const siblingFromDb = await em.findOneOrFail(CardNode, siblingCardNode.id);
			expect(siblingFromDb).toBeDefined();
		});

		it('should update position of the siblings', async () => {
			const { user, cardNode, siblingCardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			cardNode.position = 0;
			siblingCardNode.position = 1;

			await api.delete(cardNode.id);

			const siblingFromDb = await em.findOneOrFail(CardNode, siblingCardNode.id);
			expect(siblingFromDb.position).toEqual(0);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { cardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.delete(cardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
