import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType, ContentElementType } from '@shared/domain';
import {
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
import { CardResponse } from '../dto';

const baseRouteName = '/columns';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(columnId: string, requestBody?: object) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${columnId}/cards`)
			.set('Accept', 'application/json')
			.send(requestBody);

		return {
			result: response.body as CardResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`card create (api)`, () => {
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
	beforeEach(async () => {
		await cleanupCollections(em);
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

		await em.persistAndFlush([columnBoardNode, columnNode]);
		em.clear();

		const createCardBodyParams = {
			requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
		};

		return { user, columnBoardNode, columnNode, createCardBodyParams };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(columnNode.id);

			expect(response.status).toEqual(201);
		});

		it('should return the created card', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(columnNode.id);

			expect(result.id).toBeDefined();
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.post(columnNode.id);

			expect(response.status).toEqual(403);
		});
	});
	describe('with required empty elements', () => {
		it('created card should contain the required empty elements', async () => {
			const { user, columnNode, createCardBodyParams } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const expectedEmptyElements = createCardBodyParams.requiredEmptyElements.map((type) => {
				return { type, content: type === ContentElementType.FILE ? { caption: '' } : { text: '' } };
			});

			const { result } = await api.post(columnNode.id, createCardBodyParams);
			const { elements } = result;

			expect(elements[0]).toMatchObject(expectedEmptyElements[0]);
			expect(elements[1]).toMatchObject(expectedEmptyElements[1]);
		});
		it('should return status 400 as the content element is unknown', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const invalidBodyParams = {
				requiredEmptyElements: ['unknown-content-element'],
			};

			const response = await api.post(columnNode.id, invalidBodyParams);
			expect(response.status).toEqual(400);
		});
	});
});
