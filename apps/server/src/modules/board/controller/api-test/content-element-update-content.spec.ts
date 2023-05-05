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

const baseRouteName = '/elements';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async updateContent(contentElementId: string, data: { content: { text: string }; type: string }) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}/${contentElementId}/content`)
			.set('Accept', 'application/json')
			.send({ data });

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element update content (api)`, () => {
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
		const element = textElementNodeFactory.buildWithId({ parent: parentCard });

		await em.persistAndFlush([user, parentCard, column, columnBoardNode, element]);
		em.clear();

		return { user, parentCard, column, columnBoardNode, element };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.updateContent(element.id, { content: { text: 'hello world' }, type: 'text' });

			expect(response.status).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.updateContent(element.id, { content: { text: 'hello world' }, type: 'text' });
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
