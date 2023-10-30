import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { cleanupCollections } from '@shared/testing/cleanup-collections';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { mapUserToCurrentUser } from '@shared/testing/map-user-to-current-user';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { ServerTestModule } from '@src/modules/server/server.module';

import { Request } from 'express';
import request from 'supertest';
import { ColumnResponse } from '../dto/board/column.response';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(boardId: string) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}/${boardId}/columns`)
			.set('Accept', 'application/json');

		return {
			result: response.body as ColumnResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`board create (api)`, () => {
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

		await em.persistAndFlush([user, columnBoardNode]);
		em.clear();

		return { user, columnBoardNode };
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(columnBoardNode.id);

			expect(response.status).toEqual(201);
		});

		it('should return the created column', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(columnBoardNode.id);

			expect(result.id).toBeDefined();
		});
	});

	describe('with valid user', () => {
		it('should return status 403', async () => {
			const { columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.post(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
