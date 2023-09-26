import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain';
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
import { drawingElementNodeFactory } from '@shared/testing/factory/boardnode/drawing-element-node.factory';

const baseRouteName = '/elements';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(elementId: string) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${elementId}/permission`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content drawing element check permission (api)`, () => {
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
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
		const element = drawingElementNodeFactory.buildWithId({ parent: cardNode, drawingName: cardNode.id });

		await em.persistAndFlush([user, columnBoardNode, columnNode, cardNode, element]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNode, element };
	};

	describe('with valid user', () => {
		it('should return status 204 - user has permission', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.get(element.drawingName);

			expect(response.status).toEqual(204);
		});
	});

	describe('with invalid user', () => {
		it('should not grant the permission', async () => {
			const { element } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.get(element.drawingName);

			expect(response.status).toEqual(403);
		});
	});
});
