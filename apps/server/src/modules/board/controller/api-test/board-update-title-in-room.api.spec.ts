import { EntityManager } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing/group-entity.factory';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { roleFactory } from '@testing/factory/role.factory';
import { userFactory } from '@testing/factory/user.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe(`board update title with room relation (api)`, () => {
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

		const originalTitle = 'old title';
		const columnBoardNode = columnBoardEntityFactory.build({
			title: originalTitle,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persistAndFlush([columnBoardNode]);
		em.clear();

		return { accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode, originalTitle };
	};

	describe('with user who has edit role in room', () => {
		it('should return status 204', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect(response.status).toEqual(204);
		});

		it('should actually change the board title', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const newTitle = 'new title';

			await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.title).toEqual(newTitle);
		});

		it('should sanitize the title', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const unsanitizedTitle = '<iframe>foo</iframe> bar';
			const sanitizedTitle = 'foo bar';

			await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: unsanitizedTitle });
			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);

			expect(result.title).toEqual(sanitizedTitle);
		});

		it('should return status 400 when title is too long', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const newTitle = 'a'.repeat(101);

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect((response.body as ApiValidationError).validationErrors).toEqual([
				{
					errors: ['title must be shorter than or equal to 100 characters'],
					field: ['title'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 when title is empty string', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const newTitle = '';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect((response.body as ApiValidationError).validationErrors).toEqual([
				{
					errors: ['title must be longer than or equal to 1 characters'],
					field: ['title'],
				},
			]);
			expect(response.status).toEqual(400);
		});
	});

	describe('with user who has only view role in room', () => {
		it('should return status 403', async () => {
			const { accountWithViewRole, columnBoardNode, originalTitle } = await setup();

			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect(response.status).toEqual(403);

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.title).toEqual(originalTitle);
		});
	});

	describe('with user who is not part of the room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode, originalTitle } = await setup();

			const loggedInClient = await testApiClient.login(noAccessAccount);

			const newTitle = 'new title';

			const response = await loggedInClient.patch(`${columnBoardNode.id}/title`, { title: newTitle });

			expect(response.status).toEqual(403);

			const result = await em.findOneOrFail(BoardNodeEntity, columnBoardNode.id);
			expect(result.title).toEqual(originalTitle);
		});
	});
});
