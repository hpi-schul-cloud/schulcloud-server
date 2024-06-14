import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/boards';

describe(`board update visibility (api)`, () => {
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

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('with valid user', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				isVisible: false,
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([teacherAccount, teacherUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 204', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const isVisible = true;

			const response = await loggedInClient.patch(`${columnBoardNode.id}/visibility`, { isVisible });

			expect(response.status).toEqual(204);
		});

		it('should actually change the board visibility', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const isVisible = true;

			await loggedInClient.patch(`${columnBoardNode.id}/visibility`, { isVisible });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.isVisible).toEqual(isVisible);
		});
	});

	describe('with unauthorized user', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseFactory.build({ students: [studentUser] });
			await em.persistAndFlush([studentUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				isVisible: false,
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			await em.persistAndFlush([studentAccount, studentUser, columnBoardNode]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const isVisible = true;

			const response = await loggedInClient.patch(`${columnBoardNode.id}/visibility`, { isVisible });

			expect(response.status).toEqual(403);
		});
		it('should not change the board visibility', async () => {
			const { loggedInClient, columnBoardNode } = await setup();
			const isVisible = true;
			await loggedInClient.patch(`${columnBoardNode.id}/visibility`, { isVisible });
			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.isVisible).toEqual(false);
		});
	});
});
