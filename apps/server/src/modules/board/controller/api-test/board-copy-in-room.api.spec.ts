/* import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { Permission, RoleName } from '@shared/domain/interface';
import { accountFactory } from '@src/modules/account/testing';
import { GroupEntityTypes } from '@src/modules/group/entity';
import { roomMemberEntityFactory } from '@src/modules/room-member/testing';
import { roomEntityFactory } from '@src/modules/room/testing';
import { BoardNodeEntity } from '../../repo';
import { BoardExternalReferenceType } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe(`board copy with room relation (api)`, () => {
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
			context: { id: room.id, type: BoardExternalReferenceType.Room },
		});

		await em.persistAndFlush([columnBoardNode]);
		em.clear();

		return { accountWithEditRole, accountWithViewRole, noAccessAccount, columnBoardNode };
	};

	describe('with user who has edit role in room', () => {
		it('should return status 201', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(201);
		});

		it('should actually copy the board', async () => {
			const { accountWithEditRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithEditRole);

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);
			const body = response.body as CopyApiResponse;

			const expectedBody: CopyApiResponse = {
				id: expect.any(String),
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
			};

			expect(body).toEqual(expectedBody);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const result = await em.findOneOrFail(BoardNodeEntity, body.id!);

			expect(result).toBeDefined();
		});

		describe('with invalid id', () => {
			it('should return status 400', async () => {
				const { accountWithEditRole } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.post(`invalid-id/copy`);

				expect(response.status).toEqual(400);
			});
		});

		describe('with unknown id', () => {
			it('should return status 404', async () => {
				const { accountWithEditRole } = await setup();

				const loggedInClient = await testApiClient.login(accountWithEditRole);

				const response = await loggedInClient.post(`65e84684e43ba80204598425/copy`);

				expect(response.status).toEqual(404);
			});
		});
	});

	describe('with user who has only view role in room', () => {
		it('should return status 403', async () => {
			const { accountWithViewRole, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(accountWithViewRole);

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});

	describe('with user who is not part of the room', () => {
		it('should return status 403', async () => {
			const { noAccessAccount, columnBoardNode } = await setup();

			const loggedInClient = await testApiClient.login(noAccessAccount);

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(403);
		});
	});
});
 */
