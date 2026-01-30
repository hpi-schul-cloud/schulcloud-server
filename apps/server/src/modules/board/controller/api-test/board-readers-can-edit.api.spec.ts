import { EntityManager } from '@mikro-orm/mongodb';
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
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../../board.config';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';
import { BoardResponse } from '../dto';

const baseRouteName = '/boards';

describe(`board readersCanEdit setting (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: BoardConfig;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
		config = module.get<BoardConfig>(BOARD_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureBoardReadersCanEditToggle = true;
	});

	const setup = async () => {
		const school = schoolEntityFactory.buildWithId();

		const userWithAdminRole = userFactory.buildWithId({ school });
		const accountWithAdminRole = accountFactory.withUser(userWithAdminRole).build();

		const userWithEditRole = userFactory.buildWithId({ school });
		const accountWithEditRole = accountFactory.withUser(userWithEditRole).build();

		const userWithViewRole = userFactory.buildWithId({ school });
		const accountWithViewRole = accountFactory.withUser(userWithViewRole).build();

		const noAccessUser = userFactory.buildWithId({ school });
		const noAccessAccount = accountFactory.withUser(noAccessUser).build();

		const { roomAdminRole, roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

		const userGroup = groupEntityFactory.buildWithId({
			type: GroupEntityTypes.ROOM,
			users: [
				{ user: userWithAdminRole, role: roomAdminRole },
				{ user: userWithEditRole, role: roomEditorRole },
				{ user: userWithViewRole, role: roomViewerRole },
			],
		});

		const room = roomEntityFactory.buildWithId({ schoolId: school.id });

		const roomMembership = roomMembershipEntityFactory.build({
			roomId: room.id,
			userGroupId: userGroup.id,
			schoolId: school.id,
		});

		await em
			.persist([
				accountWithAdminRole,
				accountWithEditRole,
				accountWithViewRole,
				noAccessAccount,
				userWithAdminRole,
				userWithEditRole,
				userWithViewRole,
				noAccessUser,
				roomAdminRole,
				roomEditorRole,
				roomViewerRole,
				userGroup,
				room,
				roomMembership,
				school,
			])
			.flush();

		const columnBoardNode = columnBoardEntityFactory.build({
			readersCanEdit: false,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persist([columnBoardNode]).flush();
		em.clear();

		return { accountWithAdminRole, accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode };
	};

	describe('toggle the setting', () => {
		describe('with user who has admin role in room', () => {
			it('should return status 204', async () => {
				const { accountWithAdminRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithAdminRole);

				const readersCanEdit = true;

				const response = await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				expect(response.status).toEqual(204);
			});

			it('should actually change the board visibility', async () => {
				const { accountWithAdminRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithAdminRole);

				const readersCanEdit = true;

				await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.readersCanEdit).toEqual(readersCanEdit);
			});
		});

		describe('with feature flag disabled', () => {
			it('should return status 403', async () => {
				const { accountWithAdminRole, columnBoardNode } = await setup();
				config.featureBoardReadersCanEditToggle = false;

				const loggedInClient = await testApiClient.login(accountWithAdminRole);

				const readersCanEdit = true;

				const response = await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				expect(response.status).toEqual(403);
			});

			it('should not change the board visibility', async () => {
				const { accountWithAdminRole, columnBoardNode } = await setup();
				config.featureBoardReadersCanEditToggle = false;

				const loggedInClient = await testApiClient.login(accountWithAdminRole);

				const readersCanEdit = true;

				await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.readersCanEdit).toEqual(false);
			});
		});

		describe('with user who has only edit role in room', () => {
			it('should return status 403', async () => {
				const { accountWithEditRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const readersCanEdit = true;

				const response = await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				expect(response.status).toEqual(403);
			});

			it('should not change the board visibility', async () => {
				const { accountWithEditRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const readersCanEdit = true;

				await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.readersCanEdit).toEqual(false);
			});
		});

		describe('with user who has only view role in room', () => {
			it('should return status 403', async () => {
				const { accountWithViewRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithViewRole);

				const readersCanEdit = true;

				const response = await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				expect(response.status).toEqual(403);
			});

			it('should not change the board visibility', async () => {
				const { accountWithViewRole, columnBoardNode } = await setup();

				const loggedInClient = await testApiClient.login(accountWithViewRole);

				const readersCanEdit = true;

				await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				const response = await loggedInClient.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.readersCanEdit).toEqual(false);
			});
		});

		describe('with user who is not part of the room', () => {
			it('should return status 403', async () => {
				const { noAccessAccount, columnBoardNode } = await setup();
				const loggedInClient = await testApiClient.login(noAccessAccount);
				const readersCanEdit = true;

				const response = await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				expect(response.status).toEqual(403);
			});
			it('should not change the board visibility', async () => {
				const { noAccessAccount, columnBoardNode, accountWithViewRole } = await setup();
				const loggedInClient = await testApiClient.login(noAccessAccount);
				const readersCanEdit = true;

				await loggedInClient.patch(`${columnBoardNode.id}/readers-can-edit`, { readersCanEdit });

				const loggedInClientWithView = await testApiClient.login(accountWithViewRole);

				const response = await loggedInClientWithView.get(columnBoardNode.id);
				const result = response.body as BoardResponse;

				expect(result.readersCanEdit).toEqual(false);
			});
		});
	});

	describe('when the setting is enabled', () => {
		it('should allow users with view role to edit the board', async () => {
			const { accountWithViewRole, accountWithAdminRole, columnBoardNode } = await setup();

			const loggedInAdmin = await testApiClient.login(accountWithAdminRole);
			const settingResponse = await loggedInAdmin.patch(`${columnBoardNode.id}/readers-can-edit`, {
				readersCanEdit: true,
			});
			expect(settingResponse.status).toEqual(204);

			const loggedInViewer = await testApiClient.login(accountWithViewRole);
			const newTitle = 'new title';
			const patchresponse = await loggedInViewer.patch(`${columnBoardNode.id}/title`, { title: newTitle });
			expect(patchresponse.status).toEqual(204);

			const checkResponse = await loggedInViewer.get(columnBoardNode.id);
			const result = checkResponse.body as BoardResponse;

			expect(result.title).toEqual(newTitle);
		});
	});

	describe('when the setting is disabled', () => {
		it('should allow users with view role to edit the board', async () => {
			const { accountWithViewRole, accountWithAdminRole, columnBoardNode } = await setup();

			const loggedInAdmin = await testApiClient.login(accountWithAdminRole);
			const settingResponse = await loggedInAdmin.patch(`${columnBoardNode.id}/readers-can-edit`, {
				readersCanEdit: false,
			});
			expect(settingResponse.status).toEqual(204);

			const loggedInViewer = await testApiClient.login(accountWithViewRole);
			const newTitle = 'new title';
			const patchresponse = await loggedInViewer.patch(`${columnBoardNode.id}/title`, { title: newTitle });
			expect(patchresponse.status).toEqual(403);

			const checkResponse = await loggedInViewer.get(columnBoardNode.id);
			const result = checkResponse.body as BoardResponse;

			expect(result.title).not.toEqual(newTitle);
		});
	});
});
