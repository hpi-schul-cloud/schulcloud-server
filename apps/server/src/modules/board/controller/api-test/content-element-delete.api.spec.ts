import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType, RichTextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	richTextElementNodeFactory,
	userFactory,
} from '@shared/testing';
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
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });
		const element = richTextElementNodeFactory.buildWithId({ parent: cardNode });
		const sibling = richTextElementNodeFactory.buildWithId({ parent: cardNode });

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

			await expect(em.findOneOrFail(RichTextElementNode, element.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, element, sibling } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(element.id);

			const siblingFromDb = await em.findOneOrFail(RichTextElementNode, sibling.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	describe('with valid user', () => {
		it('should return status 403', async () => {
			const { element } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.delete(element.id);

			expect(response.status).toEqual(403);
		});
	});
});
