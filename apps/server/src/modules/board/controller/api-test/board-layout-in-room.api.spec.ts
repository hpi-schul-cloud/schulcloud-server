import { EntityManager } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { roleFactory } from '@testing/factory/role.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';

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
		const userWithEditRole = userFactory.buildWithId();
		const accountWithEditRole = accountFactory.withUser(userWithEditRole).build();

		const userWithViewRole = userFactory.buildWithId();
		const accountWithViewRole = accountFactory.withUser(userWithViewRole).build();

		const noAccessUser = userFactory.buildWithId();
		const noAccessAccount = accountFactory.withUser(noAccessUser).build();

		const roleRoomEdit = roleFactory.buildWithId({
			name: RoleName.ROOMEDITOR,
			permissions: [Permission.ROOM_EDIT],
		});
		const roleRoomView = roleFactory.buildWithId({
			name: RoleName.ROOMVIEWER,
			permissions: [Permission.ROOM_VIEW],
		});

		const userGroup = groupEntityFactory.buildWithId({
			type: GroupEntityTypes.ROOM,
			users: [
				{ user: userWithEditRole, role: roleRoomEdit },
				{ user: userWithViewRole, role: roleRoomView },
			],
		});

		const room = roomEntityFactory.buildWithId();

		const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

		await em.persistAndFlush([
			accountWithEditRole,
			accountWithViewRole,
			noAccessAccount,
			userWithEditRole,
			userWithViewRole,
			noAccessUser,
			roleRoomEdit,
			roleRoomView,
			userGroup,
			room,
			roomMembership,
		]);

		const columnBoardNode = columnBoardEntityFactory.build({
			layout: BoardLayout.COLUMNS,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persistAndFlush([columnBoardNode]);
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
