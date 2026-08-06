import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	linkElementEntityFactory,
} from '../../testing';
import type { ColumnFullResponse, LinkElementResponse } from '../dto';

const baseRouteName = '/columns';

describe(`column copy (api)`, () => {
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

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

		const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
		await em.persist([teacherUser, teacherAccount, course]).flush();

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode1 = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode1a = cardEntityFactory.withParent(columnNode1).build();
		const cardNode1b = cardEntityFactory.withParent(columnNode1).build();
		const columnNode2 = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode2a = cardEntityFactory.withParent(columnNode2).build();

		const linkElement1 = linkElementEntityFactory.withParent(cardNode1a).build({
			url: `https://my-svs-test-url.de/boards/${columnBoardNode.id}#card-${cardNode1b.id}`,
		});
		const linkElement2 = linkElementEntityFactory.withParent(cardNode1a).build({
			url: `https://my-svs-test-url.de/boards/${columnBoardNode.id}#card-${cardNode2a.id}`,
		});
		await em
			.persist([
				columnNode1,
				columnNode2,
				columnBoardNode,
				cardNode1a,
				cardNode1b,
				cardNode2a,
				linkElement1,
				linkElement2,
			])
			.flush();
		em.clear();

		const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(teacherAccount);

		return {
			loggedInClient,
			columnNode1,
			columnNode2,
			columnBoardNode,
			cardNode1a,
			cardNode1b,
			cardNode2a,
			linkElement1,
			linkElement2,
		};
	};

	describe('with valid user', () => {
		it('should return status 201', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);

			expect(response.status).toEqual(201);
		});

		it('should return copied column response', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnFullResponse;

			expect(copiedColumn.id).toBeDefined();
			expect(copiedColumn.title).toEqual(columnNode1.title);
		});

		it('should actually copy the column in the same board', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnFullResponse;

			const result = await em.findOneOrFail(BoardNodeEntity, copiedColumn.id);

			expect(result.path).toEqual(columnNode1.path);
		});

		it('should place the column under the original', async () => {
			const { loggedInClient, columnNode1, columnNode2 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnFullResponse;

			const resultCopiedColumn = await em.findOneOrFail(BoardNodeEntity, copiedColumn.id);
			const resultColumn1 = await em.findOneOrFail(BoardNodeEntity, columnNode1.id);
			const resultColumn2 = await em.findOneOrFail(BoardNodeEntity, columnNode2.id);

			expect(resultColumn1.position).toEqual(columnNode1.position);
			expect(resultCopiedColumn.position).toEqual(columnNode1.position + 1);
			expect(resultColumn2.position).not.toEqual(columnNode2.position);
			expect(resultColumn2.position).toEqual(resultCopiedColumn.position + 1);
		});

		it('should replace self-referencing ids in link-element-urls in the copied column', async () => {
			const { loggedInClient, columnNode1 } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnFullResponse;
			const [copiedCard1, copiedCard2] = copiedColumn.cards;
			const [copiedLinkElement1] = copiedCard1.elements;

			expect((copiedLinkElement1 as LinkElementResponse).content.url).toContain(`#card-${copiedCard2.id}`);
		});

		it('should keep non-self-referencing ids in link-element-urls in the copied column', async () => {
			const { loggedInClient, columnNode1, cardNode2a } = await setup();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);
			const copiedColumn = response.body as ColumnFullResponse;
			const [copiedCard1] = copiedColumn.cards;
			const [, copiedLinkElement2] = copiedCard1.elements;

			expect((copiedLinkElement2 as LinkElementResponse).content?.url).toContain(`#card-${cardNode2a.id}`);
		});
	});

	describe('with invalid user', () => {
		const setupNoAccess = async () => {
			const vars = await setup();

			const { studentAccount: noAccessAccount, studentUser: noAccessUser } = UserAndAccountTestFactory.buildStudent();
			await em.persist([noAccessAccount, noAccessUser]).flush();
			const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(noAccessAccount);

			return {
				...vars,
				loggedInClient,
			};
		};

		it('should return status 403', async () => {
			const { loggedInClient, columnNode1 } = await setupNoAccess();

			const response = await loggedInClient.post(`${columnNode1.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});
});
