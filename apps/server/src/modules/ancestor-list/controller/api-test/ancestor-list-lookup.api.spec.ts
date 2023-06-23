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
	richTextElementNodeFactory,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { AncestorResponse } from '../dto/ancestor.response';

const baseRouteName = '/ancestor-list';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(type: string, id: string) {
		console.log(`${baseRouteName}/${type}/${id}`);
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${type}/${id}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as AncestorResponse[],
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`ancestor-list lookup (api)`, () => {
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
		const school = schoolFactory.build();
		const roles = roleFactory.buildList(1, {
			// permissions: [Permission.COURSE_CREATE],
		});
		const user = userFactory.build({ school, roles });
		const course = courseFactory.buildWithId({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode });
		const cardNode3 = cardNodeFactory.buildWithId({ parent: columnNode });
		const richTextElement = richTextElementNodeFactory.buildWithId({ parent: cardNode1 });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, richTextElement]);
		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);

		return { columnBoardNode, columnNode, card1: cardNode1, card2: cardNode2, card3: cardNode3, user, course };
	};

	describe('with valid card ids', () => {
		it('should return status 200', async () => {
			const { user, columnBoardNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.get('columnboard', columnBoardNode.id);

			expect(response.status).toEqual(200);
			expect(response.result).toHaveLength(2);
		});
	});
});
