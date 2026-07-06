import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, ContentElementType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { CardResponse } from '../dto';
import { roomEntityFactory } from '@modules/room/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { groupEntityFactory } from '@modules/group/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { schoolEntityFactory } from '@modules/school/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';

const baseRouteName = '/columns';

describe(`card create (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async (readersCanEdit = false) => {
		await cleanupCollections(em);

		const school = schoolEntityFactory.buildWithId();

		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
		const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

		const room = roomEntityFactory.build({ schoolId: teacherUser.school.id });
		const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

		const userGroup = groupEntityFactory.buildWithId({
			type: GroupEntityTypes.ROOM,
			users: [
				{ user: teacherUser, role: roomOwnerRole },
				{ user: studentUser, role: roomViewerRole },
			],
			organization: school,
		});

		const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

		await em
			.persist([
				teacherUser,
				teacherAccount,
				studentUser,
				studentAccount,
				room,
				roomMembership,
				userGroup,
				roomViewerRole,
				roomOwnerRole,
			])
			.flush();

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: room.id, type: BoardExternalReferenceType.Room },
			readersCanEdit,
		});

		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

		await em.persist([columnBoardNode, columnNode]).flush();
		em.clear();

		const createCardBodyParams = {
			requiredEmptyElements: [ContentElementType.RICH_TEXT, ContentElementType.FILE, ContentElementType.LINK],
		};

		const loggedInTeacherClient = await apiClient.login(teacherAccount);
		const loggedInStudentClient = await apiClient.login(studentAccount);

		return {
			teacherUser,
			studentUser,
			columnBoardNode,
			columnNode,
			createCardBodyParams,
			loggedInTeacherClient,
			loggedInStudentClient,
		};
	};

	describe('with valid user who is board reader', () => {
		describe('when readers can edit is disabled', () => {
			it('should return status 403', async () => {
				const { columnNode, loggedInStudentClient } = await setup();

				const response = await loggedInStudentClient.post(`${columnNode.id}/cards`);

				expect(response.status).toEqual(403);
			});
		});

		describe('when readers can edit is enabled', () => {
			it('should return status 201', async () => {
				const { columnNode, loggedInStudentClient } = await setup(true);

				const response = await loggedInStudentClient.post(`${columnNode.id}/cards`);

				expect(response.status).toEqual(201);
			});
		});
	});

	describe('with valid user who is board editor', () => {
		it('should return status 201', async () => {
			const { columnNode, loggedInTeacherClient } = await setup();

			const response = await loggedInTeacherClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(201);
		});

		it('should return the created card', async () => {
			const { columnNode, loggedInTeacherClient } = await setup();

			const response = await loggedInTeacherClient.post(`${columnNode.id}/cards`);
			const result = response.body as CardResponse;

			expect(result.id).toBeDefined();
		});

		it('created card should contain empty text, file and link elements', async () => {
			const { columnNode, createCardBodyParams, loggedInTeacherClient } = await setup();

			const expectedEmptyElements = [
				{
					type: 'richText',
					content: {
						text: '',
					},
				},
				{
					type: 'file',
					content: {
						caption: '',
						alternativeText: '',
					},
				},
				{
					type: 'link',
					content: {
						url: '',
					},
				},
			];

			const response = await loggedInTeacherClient.post(`${columnNode.id}/cards`, createCardBodyParams);
			const result = response.body as CardResponse;
			const { elements } = result;

			expect(elements[0]).toMatchObject(expectedEmptyElements[0]);
			expect(elements[1]).toMatchObject(expectedEmptyElements[1]);
			expect(elements[2]).toMatchObject(expectedEmptyElements[2]);
		});

		it('should return status 400 as the content element is unknown', async () => {
			const { columnNode, loggedInTeacherClient } = await setup();

			const invalidBodyParams = {
				requiredEmptyElements: ['unknown-content-element'],
			};

			const response = await loggedInTeacherClient.post(`${columnNode.id}/cards`, invalidBodyParams);

			expect(response.status).toEqual(400);
		});

		describe('when position is provided', () => {
			it('should insert the card at the given position', async () => {
				const { columnNode, loggedInTeacherClient } = await setup();

				const existingCard0 = cardEntityFactory.withParent(columnNode).build({ position: 0 });
				const existingCard1 = cardEntityFactory.withParent(columnNode).build({ position: 1 });
				await em.persist([existingCard0, existingCard1]).flush();
				em.clear();

				const response = await loggedInTeacherClient.post(`${columnNode.id}/cards`, { position: 0 });
				const result = response.body as CardResponse;

				expect(response.status).toEqual(201);

				const newCardInDb = await em.findOneOrFail(BoardNodeEntity, result.id);
				expect(newCardInDb.position).toEqual(0);

				const shiftedCard0 = await em.findOneOrFail(BoardNodeEntity, existingCard0.id);
				const shiftedCard1 = await em.findOneOrFail(BoardNodeEntity, existingCard1.id);
				expect(shiftedCard0.position).toEqual(1);
				expect(shiftedCard1.position).toEqual(2);
			});
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persist([user, account]).flush();

			const api = new TestApiClient(app, baseRouteName);
			const loggedInClient = await api.login(account);

			const response = await loggedInClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(403);
		});
	});

	describe('with not logged in user', () => {
		it('should return status 403', async () => {
			const { columnNode } = await setup();
			const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();
			await em.persist([user, account]).flush();

			const response = await apiClient.post(`${columnNode.id}/cards`);

			expect(response.status).toEqual(401);
		});
	});
});
