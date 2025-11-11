import { EntityManager } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { schoolEntityFactory } from '@modules/school/testing';

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

		const roomMembership = roomMembershipEntityFactory.build({
			roomId: room.id,
			userGroupId: userGroup.id,
			schoolId: school.id,
		});

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

		it('should remove the board from the room content', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			await loggedInClient.delete(columnBoardNode.id);

			// wait for event bus
			await new Promise((resolve) => setTimeout(resolve, 10));

			const roomContent = await em.findOneOrFail('RoomContentEntity', {
				roomId: columnBoardNode.context?.id,
			});

			expect(roomContent['items']).toHaveLength(0);
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
