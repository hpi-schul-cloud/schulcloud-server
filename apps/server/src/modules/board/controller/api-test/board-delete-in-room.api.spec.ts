import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, groupEntityFactory, roleFactory, TestApiClient, userFactory } from '@shared/testing';
import { accountFactory } from '@src/modules/account/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { GroupEntityTypes } from '@src/modules/group/entity';
import { roomEntityFactory } from '@src/modules/room/testing';
import { roomMembershipEntityFactory } from '@src/modules/room-membership/testing';
import { columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { BoardNodeEntity } from '../../repo';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/boards';

describe(`board delete in room (api)`, () => {
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

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		const userWithEditRole = userFactory.buildWithId();
		const accountWithEditRole = accountFactory.withUser(userWithEditRole).build();

		const userWithViewRole = userFactory.buildWithId();
		const accountWithViewRole = accountFactory.withUser(userWithViewRole).build();

		const noAccessUser = userFactory.buildWithId();
		const noAccessAccount = accountFactory.withUser(noAccessUser).build();

		const roleRoomEdit = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_EDIT] });
		const roleRoomView = roleFactory.buildWithId({ name: RoleName.ROOMVIEWER, permissions: [Permission.ROOM_VIEW] });

		const userGroup = groupEntityFactory.buildWithId({
			type: GroupEntityTypes.ROOM,
			users: [
				{ user: userWithEditRole, role: roleRoomEdit },
				{ user: userWithViewRole, role: roleRoomView },
			],
		});

		const room = roomEntityFactory.buildWithId();

		const roomMember = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

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
			roomMember,
		]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

		await em.persistAndFlush([columnBoardNode, columnNode]);
		em.clear();

		return { accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode, columnNode };
	};

	describe('with valid user which is allowed to edit room', () => {
		it('should return status 204', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.delete(columnBoardNode.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete the board', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			await loggedInClient.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnBoardNode.id)).rejects.toThrow();
		});

		it('should actually delete columns of the board', async () => {
			const { accountWithEditRole, columnNode, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			await loggedInClient.delete(columnBoardNode.id);

			await expect(em.findOneOrFail(BoardNodeEntity, columnNode.id)).rejects.toThrow();
		});
	});

	describe('with invalid user who has only view rights to the room', () => {
		it('should return status 403', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const response = await loggedInClient.delete(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});

	describe('with invalid user who has no access to the room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(noAccessAccount);

			const response = await loggedInClient.delete(columnBoardNode.id);

			expect(response.status).toEqual(403);
		});
	});
});
