import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { SchoolEntity } from '@modules/school/repo';
import { User } from '@modules/user/repo';
import { AccountEntity } from '@modules/account/repo';
import { schoolSystemOptionsEntityFactory } from '@modules/legacy-school/testing';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';

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
		testApiClient = new TestApiClient(app, 'rooms/stats');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_ADMINISTRATE_ROOMS_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /rooms/stats', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has the required permissions', () => {
			const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const createRoom = async (school: SchoolEntity, users: User[]) => {
				const room = roomEntityFactory.build({ schoolId: school.id });

				const groupUsers = users.map((user, index) => {
					const role = index === 0 ? roomOwnerRole : roomViewerRole;
					return { user, role };
				});
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: groupUsers,
					organization: school,
					externalSource: undefined,
				});

				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});

				await em.persistAndFlush([room, userGroupEntity, roomMembership]);
				em.clear();

				return { room, userGroupEntity, roomMembership };
			};

			const createUsers = async (school: SchoolEntity, userCount: number) => {
				const accounts: AccountEntity[] = [];
				const users: User[] = [];
				for (let i = 0; i < userCount; i++) {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					users.push(teacherUser);
					accounts.push(teacherAccount);
				}
				await em.persistAndFlush([school, ...users, ...accounts]);
				em.clear();

				return { school, users, accounts };
			};

			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();
				const schoolSystemOptions: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					school,
					provisioningOptions: {
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					},
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

				await em.persistAndFlush([adminAccount, adminUser, roomOwnerRole, school, otherSchool, schoolSystemOptions]);
				await em.persistAndFlush([roomViewerRole, roomOwnerRole]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return { loggedInClient, school, otherSchool, adminUser, adminAccount };
			};

			describe('when a room with users of the same school exists', () => {
				it('should return a room', async () => {
					const { loggedInClient, school } = await setup();
					const { users } = await createUsers(school, 3);
					const { room } = await createRoom(school, users);

					const response = (await loggedInClient.get()) as { status: number; body: { data: unknown[] } };

					expect(response.status).toBe(HttpStatus.OK);
					expect(response.body.data).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								name: room.name,
								totalMembers: users.length,
								internalMembers: users.length,
								externalMembers: 0,
							}),
						])
					);
				});
			});

			describe('when rooms with and without users of the same school exist', () => {
				it('should return only rooms with users of the same school', async () => {
					const { loggedInClient, school, otherSchool } = await setup();
					const { users: internalUsers } = await createUsers(school, 3);
					const { users: otherInternalUsers } = await createUsers(school, 1);
					const { users: externalUsers } = await createUsers(otherSchool, 2);
					const { room: room1 } = await createRoom(school, internalUsers);
					const { room: room2 } = await createRoom(school, externalUsers);
					const { room: room3 } = await createRoom(school, [...externalUsers, ...otherInternalUsers]);
					const { room: room4 } = await createRoom(otherSchool, [...internalUsers, ...externalUsers]);

					const response = (await loggedInClient.get()) as { status: number; body: { data: unknown[] } };
					expect(response.status).toBe(HttpStatus.OK);
					expect(response.body.data).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								name: room1.name,
								totalMembers: internalUsers.length,
								internalMembers: internalUsers.length,
								externalMembers: 0,
							}),
							expect.objectContaining({
								name: room3.name,
								totalMembers: externalUsers.length + otherInternalUsers.length,
								internalMembers: otherInternalUsers.length,
								externalMembers: externalUsers.length,
							}),
							expect.objectContaining({
								name: room4.name,
								totalMembers: externalUsers.length + internalUsers.length,
								internalMembers: internalUsers.length,
								externalMembers: externalUsers.length,
							}),
						])
					);
					expect(response.body.data).not.toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								name: room2.name,
								totalMembers: externalUsers.length,
								internalMembers: externalUsers.length,
								externalMembers: 0,
							}),
						])
					);
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();

					const response = (await loggedInClient.get()) as { status: number; body: { data: unknown[] } };

					expect(response.status).toBe(HttpStatus.OK);
					expect(response.body.data).toEqual([]);
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
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get();

					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});
	});
});
