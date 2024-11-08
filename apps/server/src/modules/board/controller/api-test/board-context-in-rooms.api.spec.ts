import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { accountFactory } from '@src/modules/account/testing';
import { GroupEntityTypes } from '@src/modules/group/entity';
import { roomMemberEntityFactory } from '@src/modules/room-member/testing';
import { roomEntityFactory } from '@src/modules/room/testing';
import { columnBoardEntityFactory } from '../../testing';
import { BoardExternalReferenceType } from '../../domain';

const baseRouteName = '/boards';

describe('board get context in room (api)', () => {
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
			name: RoleName.ROOM_EDITOR,
			permissions: [Permission.ROOM_EDIT],
		});
		const roleRoomView = roleFactory.buildWithId({
			name: RoleName.ROOM_VIEWER,
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

		const roomMember = roomMemberEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

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
			isVisible: false,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persistAndFlush([columnBoardNode]);
		em.clear();

		return { accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode };
	};

	describe('with user who has edit role in room', () => {
		it('should return status 200', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.status).toEqual(200);
		});

		it('should return the context', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.body).toEqual({ id: columnBoardNode.context?.id, type: columnBoardNode.context?.type });
		});
	});

	describe('with user who has only view role in room', () => {
		it('should return status 403', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.status).toEqual(403);
		});
	});

	describe('with user who is not part of the room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(noAccessAccount);

			const response = await loggedInClient.get(`${columnBoardNode.id}/context`);

			expect(response.status).toEqual(403);
		});
	});
});
