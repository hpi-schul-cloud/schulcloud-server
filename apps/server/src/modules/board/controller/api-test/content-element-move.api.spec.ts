import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType, pathOfChildren } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';
import { MoveContentElementBody } from '../dto';

const baseRouteName = '/elements';

describe(`content element move (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

		const course = courseFactory.build({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const column = columnEntityFactory.withParent(columnBoardNode).build();
		const parentCard = cardEntityFactory.withParent(column).build();
		const targetCard = cardEntityFactory.withParent(column).build();
		const targetCardElements = richTextElementEntityFactory.withParent(targetCard).buildList(4);
		const element = richTextElementEntityFactory.withParent(parentCard).build();

		await em.persistAndFlush([parentCard, column, targetCard, columnBoardNode, ...targetCardElements, element]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return {
			loggedInClient,
			teacherAccount,
			teacherUser,
			parentCard,
			column,
			targetCard,
			columnBoardNode,
			targetCardElements,
			element,
		};
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { loggedInClient, element, targetCard } = await setup();

			const params: MoveContentElementBody = {
				toCardId: targetCard.id,
				toPosition: 4,
			};

			const response = await loggedInClient.put(`${element.id}/position`, params);

			expect(response.status).toEqual(204);
		});

		it('should actually move the element', async () => {
			const { loggedInClient, element, targetCard } = await setup();

			const params: MoveContentElementBody = {
				toCardId: targetCard.id,
				toPosition: 2,
			};

			await loggedInClient.put(`${element.id}/position`, params);

			const result = await em.findOneOrFail(BoardNodeEntity, element.id);

			expect(result.path).toEqual(pathOfChildren(targetCard));
			expect(result.position).toEqual(2);
		});
	});

	describe('when the user has no access to the board', () => {
		const setupNoAccess = async () => {
			const vars = await setup();

			const { studentAccount: noAccessAccount, studentUser: noAccessUser } = UserAndAccountTestFactory.buildStudent();
			await em.persistAndFlush([noAccessAccount, noAccessUser]);
			const loggedInClient = await testApiClient.login(noAccessAccount);

			return {
				...vars,
				noAccessAccount,
				noAccessUser,
				loggedInClient,
			};
		};

		it('should return status 403', async () => {
			const { loggedInClient, element, targetCard } = await setupNoAccess();

			const params: MoveContentElementBody = {
				toCardId: targetCard.id,
				toPosition: 3,
			};

			const response = await loggedInClient.put(`${element.id}/position`, params);

			expect(response.status).toEqual(403);
		});
	});
});
