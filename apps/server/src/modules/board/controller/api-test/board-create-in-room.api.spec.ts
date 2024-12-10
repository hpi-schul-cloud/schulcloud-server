import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { cleanupCollections, groupEntityFactory, roleFactory, TestApiClient, userFactory } from '@shared/testing';
import { accountFactory } from '@src/modules/account/testing';
import { GroupEntityTypes } from '@src/modules/group/entity';
import { roomMembershipEntityFactory } from '@src/modules/room-membership/testing';
import { roomEntityFactory } from '@src/modules/room/testing';
import { BoardExternalReferenceType, BoardLayout } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import { CreateBoardBodyParams } from '../dto';

const baseRouteName = '/boards';

describe(`create board in room (api)`, () => {
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

	describe('When request is valid', () => {
		describe('When user is allowed to edit the room', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const account = accountFactory.withUser(user).build();

				const role = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_EDIT] });

				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ user, role }],
				});

				const room = roomEntityFactory.buildWithId();

				const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

				await em.persistAndFlush([account, user, role, userGroup, room, roomMembership]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, room };
			};

			it('should return status 201 and board', async () => {
				const { loggedInClient, room } = await setup();
				const title = 'new board';

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title,
					parentId: room.id,
					parentType: BoardExternalReferenceType.Room,
					layout: BoardLayout.COLUMNS,
				});

				const boardId = (response.body as { id: string }).id;
				expect(response.status).toEqual(201);
				expect(boardId).toBeDefined();

				const dbResult = await em.findOneOrFail(BoardNodeEntity, boardId);
				expect(dbResult.title).toEqual(title);
			});

			describe('Board layout', () => {
				describe(`When layout is set to "${BoardLayout.COLUMNS}"`, () => {
					it('should create a column board', async () => {
						const { loggedInClient, room } = await setup();

						const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
							title: 'new board',
							parentId: room.id,
							parentType: BoardExternalReferenceType.Room,
							layout: BoardLayout.COLUMNS,
						});

						const boardId = (response.body as { id: string }).id;
						expect(response.status).toEqual(201);
						expect(boardId).toBeDefined();

						const dbResult = await em.findOneOrFail(BoardNodeEntity, boardId);
						expect(dbResult.layout).toEqual(BoardLayout.COLUMNS);
					});
				});

				describe(`When layout is set to "${BoardLayout.LIST}"`, () => {
					it('should create a list board', async () => {
						const { loggedInClient, room } = await setup();

						const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
							title: 'new board',
							parentId: room.id,
							parentType: BoardExternalReferenceType.Room,
							layout: BoardLayout.LIST,
						});

						const boardId = (response.body as { id: string }).id;
						expect(response.status).toEqual(201);
						expect(boardId).toBeDefined();

						const dbResult = await em.findOneOrFail(BoardNodeEntity, boardId);
						expect(dbResult.layout).toEqual(BoardLayout.LIST);
					});
				});
			});

			describe('When layout is omitted', () => {
				it('should return status 400', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'layout'>>{
						title: 'new board',
						parentId: room.id,
						parentType: BoardExternalReferenceType.Room,
						layout: undefined,
					});

					expect(response.status).toEqual(400);
				});
			});

			describe('When layout is invalid', () => {
				it('should return status 400', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'layout'>>{
						title: 'new board',
						parentId: room.id,
						parentType: BoardExternalReferenceType.Room,
						layout: 'invalid',
					});

					expect(response.status).toEqual(400);
				});
			});
		});

		describe('When user is only allowed to view the room', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const account = accountFactory.withUser(user).build();

				const role = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_VIEW] });

				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ user, role }],
				});

				const room = roomEntityFactory.buildWithId();

				const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

				await em.persistAndFlush([account, user, role, userGroup, room, roomMembership]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, room };
			};

			it('should return status 403', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'new board',
					parentId: room.id,
					parentType: BoardExternalReferenceType.Room,
					layout: BoardLayout.COLUMNS,
				});

				expect(response.status).toEqual(403);
			});
		});

		describe('When user is not allowed in the room at all', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const account = accountFactory.withUser(user).build();

				const room = roomEntityFactory.buildWithId();

				await em.persistAndFlush([account, user, room]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, room };
			};

			it('should return status 403', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'new board',
					parentId: room.id,
					parentType: BoardExternalReferenceType.Room,
					layout: BoardLayout.COLUMNS,
				});

				expect(response.status).toEqual(403);
			});
		});
	});

	describe('When request is invalid', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const account = accountFactory.withUser(user).build();

			const role = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_EDIT] });

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ user, role }],
			});

			const room = roomEntityFactory.buildWithId();

			const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

			await em.persistAndFlush([account, user, role, userGroup, room, roomMembership]);
			em.clear();

			const loggedInClient = await testApiClient.login(account);

			return { loggedInClient, room };
		};

		describe('When title is empty', () => {
			it('should return status 400', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: '',
					parentId: room.id,
					parentType: BoardExternalReferenceType.Room,
				});

				expect(response.status).toEqual(400);
			});
		});

		describe('When title is too long', () => {
			it('should return status 400', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.post(undefined, <CreateBoardBodyParams>{
					title: 'a'.repeat(101),
					parentId: room.id,
					parentType: BoardExternalReferenceType.Room,
				});

				expect(response.status).toEqual(400);
			});
		});

		describe('When parent type is invalid', () => {
			it('should return status 400', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.post(undefined, <Omit<CreateBoardBodyParams, 'parentType'>>{
					title: 'new board',
					parentId: room.id,
					parentType: 'invalid',
					layout: BoardLayout.COLUMNS,
				});

				expect(response.status).toEqual(400);
			});
		});
	});
});
