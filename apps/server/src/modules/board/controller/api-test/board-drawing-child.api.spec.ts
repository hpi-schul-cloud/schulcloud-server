import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { drawingElementNodeFactory } from '@shared/testing/factory/boardnode/drawing-element-node.factory';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(id: string) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${id}/hasDrawingChild`)
			.set('Accept', 'application/json');

		return {
			result: response.text === 'true',
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`has drawing child (api)`, () => {
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
		const course2 = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course, course2]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnBoardNoChildrenNode = columnBoardNodeFactory.buildWithId({
			context: { id: course2.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
		const drawingNode = drawingElementNodeFactory.buildWithId({ parent: cardNode });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, drawingNode, columnBoardNoChildrenNode]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return { columnBoardNode, columnBoardNoChildrenNode };
	};

	describe('with valid board ids', () => {
		it('should return status 200', async () => {
			const { columnBoardNode } = await setup();

			const response = await api.get(`${columnBoardNode.id}`);

			expect(response.status).toEqual(200);
		});

		it('should return true as response', async () => {
			const { columnBoardNode } = await setup();

			const result = await api.get(columnBoardNode.id);

			expect(result.result).toEqual(true);
		});

		it('should return false as response', async () => {
			const { columnBoardNoChildrenNode } = await setup();

			const { result } = await api.get(columnBoardNoChildrenNode.id);

			expect(result).toEqual(false);
		});
	});

	describe('with invalid board id', () => {
		it('should return status 404', async () => {
			await setup();
			const notExistingBoardId = new ObjectId().toString();

			const response = await api.get(notExistingBoardId);

			expect(response.status).toEqual(404);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.get(`${columnBoardNode.id}`);

			expect(response.status).toEqual(403);
		});
	});
});
