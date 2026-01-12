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
import { ApiValidationError } from '@shared/common/error';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { columnBoardEntityFactory } from '../../testing';
import { schoolEntityFactory } from '@modules/school/testing';

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
		});

		const room = roomEntityFactory.buildWithId({ schoolId: school.id });

		const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

		await em
			.persist([
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
			])
			.flush();

		const originalTitle = 'old title';
		const columnBoardNode = columnBoardEntityFactory.build({
			title: originalTitle,
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persist([columnBoardNode]).flush();
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
