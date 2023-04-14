import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { CardNode, TextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	mapUserToCurrentUser,
	textElementNodeFactory,
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

		const columnBoardNode = columnBoardNodeFactory.buildWithId();
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
		const textElementNode = textElementNodeFactory.buildWithId({ parent: cardNode });
		const siblingCardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		await em.persistAndFlush([user, cardNode, columnNode, siblingCardNode, textElementNode]);
		em.clear();

		return { user, cardNode, columnBoardNode, columnNode, siblingCardNode, textElementNode };
	};

	describe('with valid user', () => {
		it('should return status 200', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(cardNode.id);

			expect(response.status).toEqual(200);
		});

		it('should actually delete card', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(cardNode.id);

			await expect(em.findOneOrFail(CardNode, cardNode.id)).rejects.toThrow();
		});

		it('should actually delete elements of the card', async () => {
			const { user, cardNode, textElementNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(cardNode.id);

			await expect(em.findOneOrFail(TextElementNode, textElementNode.id)).rejects.toThrow();
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

	// TODO: add tests for permission checks... during their implementation
});
