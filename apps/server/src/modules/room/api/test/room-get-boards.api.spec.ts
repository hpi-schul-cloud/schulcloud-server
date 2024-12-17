import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	cleanupCollections,
	groupEntityFactory,
	roleFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { BoardExternalReferenceType } from '@modules/board';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { roomMembershipEntityFactory } from '@src/modules/room-membership/testing';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { roomEntityFactory } from '../../testing';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: ServerConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_ROOMS_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /rooms/:id/boards', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.get(someId);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				config.FEATURE_ROOMS_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();
				const response = await loggedInClient.get(`${someId}/boards`);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when id is not a valid mongo id', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 400 error', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get('42/boards');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const board = columnBoardEntityFactory.build({
					context: { type: BoardExternalReferenceType.Room, id: room.id },
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const role = roleFactory.buildWithId({
					name: RoleName.ROOMVIEWER,
					permissions: [Permission.ROOM_VIEW],
				});
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role, user: studentUser }],
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em.persistAndFlush([room, board, studentAccount, studentUser, role, userGroupEntity, roomMembership]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, room, board };
			};

			describe('when the room exists', () => {
				it('should return the room boards', async () => {
					const { loggedInClient, room, board } = await setup();

					const response = await loggedInClient.get(`${room.id}/boards`);
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as { data: Record<string, unknown> }).data[0]).toEqual({
						id: board.id,
						title: board.title,
						layout: board.layout,
						isVisible: board.isVisible,
						createdAt: board.createdAt.toISOString(),
						updatedAt: board.updatedAt.toISOString(),
					});
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.get(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room exists', () => {
				it('should return 403', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.get(room.id);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
