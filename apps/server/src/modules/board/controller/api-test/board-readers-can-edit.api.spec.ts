import { EntityManager } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { ServerTestModule } from '@modules/server/server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';
import { BoardResponse } from '../dto';
import { schoolEntityFactory } from '@modules/school/testing';

const baseRouteName = '/boards';

describe(`board readers can edit setting (api)`, () => {
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
		const userWithAdminRole = userFactory.buildWithId();
		const accountWithAdminRole = accountFactory.withUser(userWithAdminRole).build();

		const userWithEditRole = userFactory.buildWithId();
		const accountWithEditRole = accountFactory.withUser(userWithEditRole).build();

		const userWithViewRole = userFactory.buildWithId();
		const accountWithViewRole = accountFactory.withUser(userWithViewRole).build();

		const noAccessUser = userFactory.buildWithId();
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

		const school = schoolEntityFactory.buildWithId();
		const room = roomEntityFactory.buildWithId({ schoolId: school.id });

		const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

		await em.persistAndFlush([
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
		]);

		const columnBoardNode = columnBoardEntityFactory.build({
			readersCanEdit: false,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persistAndFlush([columnBoardNode]);
		em.clear();

		return { accountWithAdminRole, accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode };
	};

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
