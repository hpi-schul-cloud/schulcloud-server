import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomDetailsResponse } from '../dto/response/room-details.response';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');
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
				await em.persist([studentAccount, studentUser]).flush();
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
				await em
					.persist([
						room,
						studentAccount,
						studentUser,
						teacherUser,
						roomOwnerRole,
						roomViewerRole,
						userGroupEntity,
						roomMembership,
					])
					.flush();
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
					features: room.features,
				};

				return { loggedInClient, room, expectedResponse };
			};

			it('should return a room', async () => {
				const { loggedInClient, room, expectedResponse } = await setup();

				const response = await loggedInClient.get(room.id);
				expect(response.status).toBe(HttpStatus.OK);

				const body = response.body as RoomDetailsResponse;
				expect(body).toEqual(expect.objectContaining(expectedResponse));
				expect(body.allowedOperations).toEqual(expect.objectContaining({ accessRoom: true, leaveRoom: true }));
			});
		});

		describe('when the user has NOT the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([room, teacherAccount, teacherUser]).flush();
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

				await em.persist([studentAccount, studentUser]).flush();
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
				await em.persist([room, studentAccount, studentUser, roomViewerRole, userGroupEntity, roomMembership]).flush();
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

		describe('when the user is a school admin of same school', () => {
			const setup = async (roomWithUsers: boolean) => {
				const school = schoolEntityFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { teacherUser: teacherUser2 } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const users = roomWithUsers
					? [
							{ role: roomViewerRole, user: studentUser },
							{ role: roomOwnerRole, user: teacherUser },
							{ role: roomViewerRole, user: teacherUser2 },
					  ]
					: [];
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users,
					organization: school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em
					.persist([
						room,
						adminAccount,
						adminUser,
						teacherUser,
						teacherUser2,
						studentUser,
						roomOwnerRole,
						roomViewerRole,
						userGroupEntity,
						roomMembership,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const expectedResponse = {
					id: room.id,
					name: room.name,
					color: room.color,
					schoolId: room.schoolId,
					startDate: room.startDate?.toISOString(),
					endDate: room.endDate?.toISOString(),
					createdAt: room.createdAt.toISOString(),
					updatedAt: room.updatedAt.toISOString(),
					features: room.features,
				};

				return { loggedInClient, room, expectedResponse, userGroupEntity };
			};

			describe('with users in the room', () => {
				it('should return a room', async () => {
					const { loggedInClient, room, expectedResponse, userGroupEntity } = await setup(true);

					const response = await loggedInClient.get(room.id);
					expect(userGroupEntity).toBeDefined();

					expect(response.status).toBe(HttpStatus.OK);
					const body = response.body as unknown as RoomDetailsResponse;
					expect(body).toEqual(expect.objectContaining(expectedResponse));
					expect(body.allowedOperations).toEqual(expect.objectContaining({ accessRoom: true, addMembers: true }));
				});
			});

			describe('without users in the room', () => {
				it('should return a room', async () => {
					const { loggedInClient, room, expectedResponse, userGroupEntity } = await setup(false);

					const response = await loggedInClient.get(room.id);
					expect(userGroupEntity).toBeDefined();

					expect(response.status).toBe(HttpStatus.OK);
					const body = response.body as unknown as RoomDetailsResponse;
					expect(body).toEqual(expect.objectContaining(expectedResponse));
					expect(body.allowedOperations).toEqual(expect.objectContaining({ accessRoom: true, addMembers: true }));
				});
			});
		});

		describe('when the user is a school admin of different school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				const room = roomEntityFactory.build({ schoolId: otherSchool.id });
				const roomWithOwnStudents = roomEntityFactory.build({ schoolId: otherSchool.id });

				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
				const { studentUser } = UserAndAccountTestFactory.buildStudent({ school: otherSchool });
				const { studentUser: studentUserFromOwnSchool } = UserAndAccountTestFactory.buildStudent({ school });

				const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

				const userGroupEntityRoom = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomOwnerRole, user: teacherUser },
						{ role: roomViewerRole, user: studentUser },
					],
					organization: otherSchool,
					externalSource: undefined,
				});

				const userGroupEntityRoomWithOwnStudent = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomOwnerRole, user: teacherUser },
						{ role: roomViewerRole, user: studentUser },
						{ role: roomViewerRole, user: studentUserFromOwnSchool },
					],
					organization: otherSchool,
					externalSource: undefined,
				});

				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntityRoom.id,
					roomId: room.id,
					schoolId: otherSchool.id,
				});

				const roomMembershipWithOwnStudent = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntityRoomWithOwnStudent.id,
					roomId: roomWithOwnStudents.id,
					schoolId: otherSchool.id,
				});

				await em
					.persist([
						school,
						otherSchool,
						adminAccount,
						adminUser,
						teacherUser,
						studentUser,
						room,
						roomWithOwnStudents,
						studentUserFromOwnSchool,
						roomViewerRole,
						roomOwnerRole,
						userGroupEntityRoom,
						userGroupEntityRoomWithOwnStudent,
						roomMembership,
						roomMembershipWithOwnStudent,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					school,
					otherSchool,
					room,
					roomWithOwnStudents,
					teacherUser,
					studentUser,
					studentUserFromOwnSchool,
					roomMembership,
					roomMembershipWithOwnStudent,
					loggedInClient,
				};
			};

			describe('when the room has ANY students of the admin school', () => {
				it('should return return the room', async () => {
					const { loggedInClient, roomWithOwnStudents } = await setup();

					const response = await loggedInClient.get(roomWithOwnStudents.id);

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when the room has NO students of the admin school', () => {
				it('should return 403', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.get(room.id);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
