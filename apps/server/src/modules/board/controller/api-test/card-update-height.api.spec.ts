import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections, courseFactory } from '@shared/testing';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

describe(`card update height (api)`, () => {
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
		testApiClient = new TestApiClient(app, 'cards');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
		const course = courseFactory.build({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherAccount, teacherUser, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build();

		await em.persistAndFlush([cardNode, columnNode, columnBoardNode]);
		em.clear();
		const teacherClient = await testApiClient.login(teacherAccount);

		return { cardNode, teacherClient };
	};

	describe('with valid teacher user', () => {
		it('should return status 204', async () => {
			const { cardNode, teacherClient } = await setup();

			const newHeight = 350;

			const response = await teacherClient.patch(`${cardNode.id}/height`, { height: newHeight });

			expect(response.status).toEqual(204);
		});

		it('should actually change the card height', async () => {
			const { cardNode, teacherClient } = await setup();

			const newHeight = 350;

			await teacherClient.patch(`${cardNode.id}/height`, { height: newHeight });

			const result = await em.findOneOrFail(BoardNodeEntity, cardNode.id);

			expect(result.height).toEqual(newHeight);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { cardNode } = await setup();

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			await em.persistAndFlush([studentAccount, studentUser]);
			const studentClient = await testApiClient.login(studentAccount);

			const newHeight = 350;

			const response = await studentClient.patch(`${cardNode.id}/height`, { height: newHeight });

			expect(response.status).toEqual(403);
		});
	});
});
