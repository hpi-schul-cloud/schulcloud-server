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

	async delete(elementId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${elementId}`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element delete (api)`, () => {
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
		const element = textElementNodeFactory.buildWithId({ parent: cardNode });
		const sibling = textElementNodeFactory.buildWithId({ parent: cardNode });

		await em.persistAndFlush([user, columnBoardNode, columnNode, cardNode, element, sibling]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNode, element, sibling };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(element.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete element', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(element.id);

			await expect(em.findOneOrFail(TextElementNode, element.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, element, sibling } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(element.id);

			const siblingFromDb = await em.findOneOrFail(TextElementNode, sibling.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	// TODO: add tests for permission checks... during their implementation
});
