import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { ContentElementType } from '@shared/domain';
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
import { AnyContentElementResponse } from '../dto';

const baseRouteName = '/cards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(cardId: string, type: ContentElementType) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${cardId}/elements`)
			.set('Accept', 'application/json')
			.send({ type });

		return {
			result: response.body as AnyContentElementResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element create (api)`, () => {
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

		await em.persistAndFlush([user, columnBoardNode, columnNode, cardNode]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(cardNode.id, ContentElementType.RICH_TEXT);

			expect(response.status).toEqual(201);
		});

		it('should return the created content element of type RICH_TEXT', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(cardNode.id, ContentElementType.RICH_TEXT);

			expect(result.type).toEqual(ContentElementType.RICH_TEXT);
		});

		it('should return the created content element of type FILE', async () => {
			const { user, cardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(cardNode.id, ContentElementType.FILE);

			expect(result.type).toEqual(ContentElementType.FILE);
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
