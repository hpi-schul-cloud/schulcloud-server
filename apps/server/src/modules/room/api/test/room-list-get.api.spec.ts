import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomListResponse } from '../dto/response/room-list.response';

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

	describe('GET /rooms', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get();
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
				const response = await loggedInClient.get();
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const rooms = roomEntityFactory.buildListWithId(2, { schoolId: school.id });
				const roomsLocked = roomEntityFactory.buildListWithId(2, {
					schoolId: school.id,
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [
						{ role: roomViewerRole, user: studentUser },
						{ role: roomOwnerRole, user: studentUser },
					],
					type: GroupEntityTypes.ROOM,
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMemberships = rooms.map((room) =>
					roomMembershipEntityFactory.build({ userGroupId: userGroupEntity.id, roomId: room.id, schoolId: school.id })
				);

				const userGroupNoOwner = groupEntityFactory.buildWithId({
					users: [{ role: roomViewerRole, user: studentUser }],
					type: GroupEntityTypes.ROOM,
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembershipsNoOnwer = roomsLocked.map((room) =>
					roomMembershipEntityFactory.build({ userGroupId: userGroupNoOwner.id, roomId: room.id, schoolId: school.id })
				);

				await em.persistAndFlush([
					...rooms,
					...roomsLocked,
					...roomMemberships,
					...roomMembershipsNoOnwer,
					studentAccount,
					studentUser,
					userGroupEntity,
					userGroupNoOwner,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const data = rooms.map((room) => {
					return {
						id: room.id,
						name: room.name,
						color: room.color,
						schoolId: room.schoolId,
						startDate: room.startDate?.toISOString(),
						endDate: room.endDate?.toISOString(),
						createdAt: room.createdAt.toISOString(),
						updatedAt: room.updatedAt.toISOString(),
						isLocked: false,
					};
				});

				const dataLocked = roomsLocked.map((room) => {
					return {
						id: room.id,
						name: room.name,
						color: room.color,
						schoolId: room.schoolId,
						startDate: room.startDate?.toISOString(),
						endDate: room.endDate?.toISOString(),
						createdAt: room.createdAt.toISOString(),
						updatedAt: room.updatedAt.toISOString(),
						isLocked: true,
					};
				});

				const expectedResponse = {
					data: [...data, ...dataLocked],
					limit: 1000,
					skip: 0,
					total: rooms.length + roomsLocked.length,
				};

				return { loggedInClient, expectedResponse };
			};

			it('should return a list of rooms', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual(expectedResponse);
			});

			it('should return a list of rooms with pagination', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const skip = 1;
				const limit = 2;

				const response = await loggedInClient.get().query({ skip, limit });
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual({
					data: expectedResponse.data.slice(skip, skip + limit),
					limit,
					skip,
					total: expectedResponse.data.length,
				});
			});

			it('should return an alphabetically sorted list of rooms', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const rooms = response.body as RoomListResponse;
				expect(rooms.data).toEqual(rooms.data.sort((a, b) => a.name.localeCompare(b.name)));
			});
		});

		describe('when the user has NOT the required permissions', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const rooms = roomEntityFactory.buildListWithId(2);
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [{ role: roomOwnerRole, user: teacherUser }],
					type: GroupEntityTypes.ROOM,
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMemberships = rooms.map((room) =>
					roomMembershipEntityFactory.build({
						userGroupId: userGroupEntity.id,
						roomId: room.id,
						schoolId: teacherUser.school.id,
					})
				);

				await em.persistAndFlush([
					...rooms,
					...roomMemberships,
					studentAccount,
					studentUser,
					teacherUser,
					userGroupEntity,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const data = rooms.map((room) => {
					return {
						id: room.id,
						name: room.name,
						color: room.color,
						schoolId: room.schoolId,
						startDate: room.startDate?.toISOString(),
						endDate: room.endDate?.toISOString(),
						createdAt: room.createdAt.toISOString(),
						updatedAt: room.updatedAt.toISOString(),
						isLocked: false,
					};
				});
				const expectedResponse = {
					data,
					limit: 1000,
					skip: 0,
					total: rooms.length,
				};

				return { loggedInClient, expectedResponse };
			};

			it('should return an empty list of rooms', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as RoomListResponse).total).toEqual(0);
			});

			it('should return a list of rooms with pagination', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get().query({ skip: 1, limit: 1 });
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual({
					data: [],
					limit: 1,
					skip: 1,
					total: 0,
				});
			});
		});
	});
});
