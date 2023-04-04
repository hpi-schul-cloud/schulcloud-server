import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { TextElementNode } from '@shared/domain';
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

	async move(cardId: string, contentElementId: string, toCardId: string, toIndex: number) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}/${cardId}/elements/${contentElementId}/position`)
			.set('Accept', 'application/json')
			.send({ toIndex, toCardId });

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element move (api)`, () => {
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
		const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const parentCard = cardNodeFactory.buildWithId({ parent: column });
		const targetCard = cardNodeFactory.buildWithId({ parent: column });
		const targetCardElements = textElementNodeFactory.buildListWithId(4, { parent: targetCard });
		const element = textElementNodeFactory.buildWithId({ parent: parentCard });

		await em.persistAndFlush([user, parentCard, column, targetCard, columnBoardNode, ...targetCardElements, element]);
		em.clear();

		return { user, parentCard, column, targetCard, columnBoardNode, targetCardElements, element };
	};

	describe('with valid user', () => {
		it('should return status 200', async () => {
			const { user, element, parentCard, targetCard } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.move(parentCard.id, element.id, targetCard.id, 5);

			expect(response.status).toEqual(200);
		});

		it('should actually move the element', async () => {
			const { user, element, parentCard, targetCard } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.move(parentCard.id, element.id, targetCard.id, 2);
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.parentId).toEqual(targetCard.id);
			expect(result.position).toEqual(2);
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
