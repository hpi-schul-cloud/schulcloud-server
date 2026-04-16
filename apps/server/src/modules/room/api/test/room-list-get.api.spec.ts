import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { roomArrangementEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
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

	describe('GET /rooms', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
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

				await em
					.persist([
						...rooms,
						...roomsLocked,
						...roomMemberships,
						...roomMembershipsNoOnwer,
						studentAccount,
						studentUser,
						userGroupEntity,
						userGroupNoOwner,
					])
					.flush();
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
						allowedOperations: expect.any(Object) as unknown as Record<string, boolean>,
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
						allowedOperations: expect.any(Object) as unknown as Record<string, boolean>,
					};
				});

				const expectedResponse = {
					data: [...data, ...dataLocked],
				};

				return { loggedInClient, studentUser, school, rooms, roomsLocked, userGroupEntity, expectedResponse };
			};

			it('should return a list of rooms', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);

				const stripUpdatedAt = (arr: { updatedAt: unknown }[]) => arr.map(({ updatedAt, ...rest }) => rest);
				expect(stripUpdatedAt((response.body as RoomListResponse).data)).toEqual(stripUpdatedAt(expectedResponse.data));
			});

			it('should return an alphabetically sorted list of rooms', async () => {
				const { loggedInClient, rooms, roomsLocked } = await setup();

				const response = await loggedInClient.get();

				const result = response.body as RoomListResponse;
				const resultNames = result.data.map((r) => r.name);
				const expectedNames = [...rooms, ...roomsLocked].map((r) => r.name).sort((a, b) => a.localeCompare(b));

				expect(resultNames).toEqual(expectedNames);
			});

			describe('when there is a rooms arrangement for the user', () => {
				const setupWithArrangement = async () => {
					const fixtures = await setup();
					const { studentUser, rooms, roomsLocked } = fixtures;

					const roomArrangement = roomArrangementEntityFactory.build({
						userId: studentUser.id,
						items: [...roomsLocked, ...rooms].map((room) => {
							return { id: room.id };
						}),
					});
					await em.persist([roomArrangement]).flush();
					em.clear();

					return { ...fixtures, roomArrangement };
				};

				it('should return the rooms in the arranged order', async () => {
					const { loggedInClient, roomArrangement } = await setupWithArrangement();

					const response = await loggedInClient.get();

					const result = response.body as RoomListResponse;
					const resultIds = result.data.map((room) => room.id);
					const expectedIds = roomArrangement.items.map((item) => item.id);

					expect(resultIds).toEqual(expectedIds);
				});

				describe('when a room was added that is not in the arrangement', () => {
					it('should return the new room at the end of the list', async () => {
						const { loggedInClient, userGroupEntity, school } = await setupWithArrangement();

						const otherRoom = roomEntityFactory.buildWithId({ schoolId: school.id });
						const roomMembership = roomMembershipEntityFactory.build({
							userGroupId: userGroupEntity.id,
							roomId: otherRoom.id,
							schoolId: school.id,
						});
						await em.persist([otherRoom, roomMembership]).flush();
						em.clear();

						const response = await loggedInClient.get();

						const result = response.body as RoomListResponse;
						expect(result.data[result.data.length - 1].id).toBe(otherRoom.id);
					});
				});

				describe('when a room from the arrangement was deleted', () => {
					it('should return the remaining rooms in the arranged order', async () => {
						const { loggedInClient, rooms, roomArrangement } = await setupWithArrangement();

						// Delete one of the rooms in the arrangement
						await em.nativeDelete('RoomEntity', { id: rooms[0].id });
						await em.nativeDelete('RoomMembershipEntity', { id: rooms[0].id });

						const response = await loggedInClient.get();

						const result = response.body as RoomListResponse;
						const resultIds = result.data.map((room) => room.id);
						const expectedIds = roomArrangement.items.filter((item) => item.id !== rooms[0].id).map((item) => item.id);

						expect(resultIds.length).toEqual(expectedIds.length);
					});
				});
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

				await em
					.persist([...rooms, ...roomMemberships, studentAccount, studentUser, teacherUser, userGroupEntity])
					.flush();
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
				const expectedResponse = { data };

				return { loggedInClient, expectedResponse };
			};

			it('should return an empty list of rooms', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual({ data: [] });
			});
		});
	});
});
