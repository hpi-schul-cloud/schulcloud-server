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
import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';
import { schoolEntityFactory } from '@modules/school/testing';

const baseRouteName = '/boards';

describe(`board update layout with room relation (api)`, () => {
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
		]);

		const columnBoardNode = columnBoardEntityFactory.build({
			layout: BoardLayout.COLUMNS,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persist([columnBoardNode]).flush();
		em.clear();

		return { accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode };
	};

	describe('with user who has edit role in room', () => {
		it('should return status 204', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			expect(response.status).toEqual(204);
		});

		it('should actually change the board layout', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(accountWithEditRole);

			await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.layout).toEqual(BoardLayout.LIST);
		});
	});

	describe('with user who has only view role in room', () => {
		it('should return status 403', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const response = await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			expect(response.status).toEqual(403);
		});

		it('should not change the board layout', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(accountWithViewRole);

			await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.layout).toEqual(BoardLayout.COLUMNS);
		});
	});

	describe('with user who is not part of the room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(noAccessAccount);

			const response = await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			expect(response.status).toEqual(403);
		});

		it('should not change the board layout', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();
			const loggedInClient = await testApiClient.login(noAccessAccount);

			await loggedInClient.patch(`${columnBoardNode.id}/layout`, { layout: BoardLayout.LIST });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.layout).toEqual(BoardLayout.COLUMNS);
		});
	});
});
