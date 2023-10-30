import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { ColumnBoardNode } from '@shared/domain/entity/boardnode/column-board-node.entity';
import { ColumnNode } from '@shared/domain/entity/boardnode/column-node.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { cleanupCollections } from '@shared/testing/cleanup-collections';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { columnNodeFactory } from '@shared/testing/factory/boardnode/column-node.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { mapUserToCurrentUser } from '@shared/testing/map-user-to-current-user';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { ServerTestModule } from '@src/modules/server/server.module';

import { Request } from 'express';
import request from 'supertest';
import { BoardResponse } from '../dto/board/board.response';

const baseRouteName = '/boards';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(boardId: EntityId) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${boardId}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as BoardResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`board delete (api)`, () => {
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

		const columnBoardNode = columnBoardNodeFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		await em.persistAndFlush([columnBoardNode]);

		const columnNode = columnNodeFactory.build({ parent: columnBoardNode });
		await em.persistAndFlush([columnNode]);

		em.clear();

		return { user, columnBoardNode, columnNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(columnBoardNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the board', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(ColumnBoardNode, columnBoardNode.id)).rejects.toThrow();
		});

		it('should actually delete columns of the board', async () => {
			const { user, columnNode, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(ColumnNode, columnNode.id)).rejects.toThrow();
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnBoardNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.delete(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
