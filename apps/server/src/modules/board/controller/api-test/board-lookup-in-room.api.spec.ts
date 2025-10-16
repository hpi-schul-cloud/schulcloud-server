import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardResponse } from '../dto';

const baseRouteName = '/boards';

describe(`board lookup in room (api)`, () => {
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

	const setup = async () => {
		const school = schoolEntityFactory.buildWithId();
		const userWithEditRole = userFactory.buildWithId({ school });
		const accountWithEditRole = accountFactory.withUser(userWithEditRole).build();

		const userWithViewRole = userFactory.buildWithId({ school });
		const accountWithViewRole = accountFactory.withUser(userWithViewRole).build();

		const noAccessUser = userFactory.buildWithId({ school });
		const noAccessAccount = accountFactory.withUser(noAccessUser).build();

		const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

		const userGroup = groupEntityFactory.buildWithId({
			type: GroupEntityTypes.ROOM,
			users: [
				{ user: userWithEditRole, role: roomEditorRole },
				{ user: userWithViewRole, role: roomViewerRole },
			],
			organization: school,
		});

		const room = roomEntityFactory.buildWithId({ schoolId: school.id });

		const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

		await em.persistAndFlush([
			accountWithEditRole,
			accountWithViewRole,
			noAccessAccount,
			userWithEditRole,
			userWithViewRole,
			noAccessUser,
			roomEditorRole,
			roomViewerRole,
			userGroup,
			room,
			roomMembership,
			school,
		]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode1 = cardEntityFactory.withParent(columnNode).build();
		const cardNode2 = cardEntityFactory.withParent(columnNode).build();
		const cardNode3 = cardEntityFactory.withParent(columnNode).build();
		const notOfThisBoardCardNode = cardEntityFactory.build();

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode1, cardNode2, cardNode3, notOfThisBoardCardNode]);
		em.clear();

		return {
			accountWithEditRole,
			accountWithViewRole,
			noAccessAccount,
			columnBoardNode,
			columnNode,
			card1: cardNode1,
			card2: cardNode2,
			card3: cardNode3,
		};
	};

	describe('When user has edit rights in room', () => {
		describe('with valid board id', () => {
			it('should return status 200', async () => {
				const { accountWithEditRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.get(columnBoardNode.id);

				expect(response.status).toEqual(200);
			});

			it('should return the correct board', async () => {
				const { accountWithEditRole, columnBoardNode, columnNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.id).toEqual(columnBoardNode.id);
				expect(result.columns).toHaveLength(1);
				expect(result.columns[0].id).toEqual(columnNode.id);
				expect(result.columns[0].cards).toHaveLength(3);
			});
		});

		describe('board layout', () => {
			it(`should default to ${BoardLayout.COLUMNS}`, async () => {
				const { accountWithEditRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.layout).toEqual(BoardLayout.COLUMNS);
			});
		});

		describe('with invalid board id', () => {
			it('should return status 404', async () => {
				const { accountWithEditRole } = await setup();
				const notExistingBoardId = new ObjectId().toString();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.get(notExistingBoardId);

				expect(response.status).toEqual(404);
			});
		});
	});

	describe('When user has only view rights in room', () => {
		it('should return status 200', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const response = await loggedInClient.get(columnBoardNode.id);

			expect(response.status).toEqual(200);
		});
	});

	describe('When user does not belong to room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(noAccessAccount);

			const response = await loggedInClient.get(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
