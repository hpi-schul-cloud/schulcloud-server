import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /rooms/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.get(someId);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
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
				const response = await loggedInClient.get('42');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomViewerRole, user: studentUser },
						{ role: roomOwnerRole, user: teacherUser },
					],
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em.persistAndFlush([
					room,
					studentAccount,
					studentUser,
					teacherUser,
					roomOwnerRole,
					roomViewerRole,
					userGroupEntity,
					roomMembership,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const expectedResponse = {
					id: room.id,
					name: room.name,
					color: room.color,
					schoolId: room.schoolId,
					startDate: room.startDate?.toISOString(),
					endDate: room.endDate?.toISOString(),
					createdAt: room.createdAt.toISOString(),
					updatedAt: room.updatedAt.toISOString(),
					permissions: [Permission.ROOM_LIST_CONTENT, Permission.ROOM_LEAVE_ROOM],
					features: room.features,
				};

				return { loggedInClient, room, expectedResponse };
			};

			it('should return a room', async () => {
				const { loggedInClient, room, expectedResponse } = await setup();

				const response = await loggedInClient.get(room.id);
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});

		describe('when the user has NOT the required permissions', () => {
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

		describe('when the room does not exist', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 404 error', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(someId);

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the room is locked', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomViewerRole, user: studentUser }],
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em.persistAndFlush([room, studentAccount, studentUser, roomViewerRole, userGroupEntity, roomMembership]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, room };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.get(room.id);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});
	});
});
