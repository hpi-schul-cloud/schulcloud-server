import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, userFactory } from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

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

		const columnBoardNode = columnBoardEntityFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const siblingColumnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build();

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

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();
		});

		it('should actually delete cards of the column', async () => {
			const { user, cardNode, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, cardNode.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, columnNode, siblingColumnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(columnNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, siblingColumnNode.id);
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
