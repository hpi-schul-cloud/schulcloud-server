import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { BoardExternalReferenceType, Colors } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';

const baseRouteName = '/cards';

describe(`card update color (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const school = schoolEntityFactory.buildWithId();
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
		const course = courseEntityFactory.build({ school, teachers: [teacherUser] });
		await em.persist([teacherAccount, teacherUser, course, school]).flush();

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build();

		await em.persist([cardNode, columnNode, columnBoardNode]).flush();
		em.clear();
		const teacherClient = await new TestApiClientBuilder(app, baseRouteName).build(teacherAccount);

		return { cardNode, teacherClient };
	};

	describe('with valid teacher user', () => {
		it('should return status 204', async () => {
			const { cardNode, teacherClient } = await setup();

			const response = await teacherClient.patch(`${cardNode.id}/color`, { backgroundColor: Colors.BLUE });

			expect(response.status).toEqual(204);
		});

		it('should actually change the card color', async () => {
			const { cardNode, teacherClient } = await setup();

			const newColor = Colors.RED;

			await teacherClient.patch(`${cardNode.id}/color`, { backgroundColor: newColor });

			const result = await em.findOneOrFail(BoardNodeEntity, cardNode.id);

			expect(result.backgroundColor).toEqual(newColor);
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { cardNode } = await setup();

			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			await em.persist([studentAccount, studentUser]).flush();
			const studentClient = await new TestApiClientBuilder(app, baseRouteName).build(studentAccount);

			const newColor = Colors.RED;

			const response = await studentClient.patch(`${cardNode.id}/color`, { backgroundColor: newColor });

			expect(response.status).toEqual(403);
		});
	});
});
