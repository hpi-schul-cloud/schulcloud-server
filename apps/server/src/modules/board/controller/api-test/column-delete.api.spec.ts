import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { CardNode } from '@shared/domain/entity/boardnode/card-node.entity';
import { ColumnNode } from '@shared/domain/entity/boardnode/column-node.entity';
import { cleanupCollections } from '@shared/testing/cleanup-collections';
import { cardNodeFactory } from '@shared/testing/factory/boardnode/card-node.factory';
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

const baseRouteName = '/columns';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(columnId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${columnId}`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`column delete (api)`, () => {
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
		const siblingColumnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		await em.persistAndFlush([user, cardNode, columnNode, columnBoardNode, siblingColumnNode]);
		em.clear();

		return { user, cardNode, columnNode, columnBoardNode, siblingColumnNode };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(columnNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the column', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnNode.id);

			await expect(em.findOneOrFail(ColumnNode, columnNode.id)).rejects.toThrow();
		});

		it('should actually delete cards of the column', async () => {
			const { user, cardNode, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnNode.id);

			await expect(em.findOneOrFail(CardNode, cardNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, columnNode, siblingColumnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnNode.id);

			await expect(em.findOneOrFail(ColumnNode, columnNode.id)).rejects.toThrow();

			const siblingFromDb = await em.findOneOrFail(ColumnNode, siblingColumnNode.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.delete(columnNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
