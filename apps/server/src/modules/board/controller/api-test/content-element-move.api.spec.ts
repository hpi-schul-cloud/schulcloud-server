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
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/elements';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async move(contentElementId: string, toCardId: string, toPosition: number) {
		const response = await request(this.app.getHttpServer())
			.put(`${baseRouteName}/${contentElementId}/position`)
			.set('Accept', 'application/json')
			.send({ toCardId, toPosition });

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element move (api)`, () => {
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
		const column = columnEntityFactory.withParent(columnBoardNode).build();
		const parentCard = cardEntityFactory.withParent(column).build();
		const targetCard = cardEntityFactory.withParent(column).build();
		const targetCardElements = richTextElementEntityFactory.buildListWithId(4, { parent: targetCard });
		const element = richTextElementEntityFactory.withParent(parentCard).build();

		await em.persistAndFlush([user, parentCard, column, targetCard, columnBoardNode, ...targetCardElements, element]);
		em.clear();

		return { user, parentCard, column, targetCard, columnBoardNode, targetCardElements, element };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, element, targetCard } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.move(element.id, targetCard.id, 4);

			expect(response.status).toEqual(204);
		});

		it('should actually move the element', async () => {
			const { user, element, targetCard } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.move(element.id, targetCard.id, 2);
			const result = await em.findOneOrFail(BoardNodeEntity, element.id);

			expect(result.parentId).toEqual(targetCard.id);
			expect(result.position).toEqual(2);
		});
	});

	describe('with valid user', () => {
		it('should return status 403', async () => {
			const { element, targetCard } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.move(element.id, targetCard.id, 4);

			expect(response.status).toEqual(403);
		});
	});
});
