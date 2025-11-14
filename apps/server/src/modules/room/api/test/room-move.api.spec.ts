import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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
import { RoomArrangementEntity } from '../../repo';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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

	describe('PATCH /rooms', () => {
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
				const otherRoom = roomEntityFactory.buildWithId({ schoolId: school.id });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
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
				const roomMemberships = [...rooms, otherRoom].map((room) =>
					roomMembershipEntityFactory.build({ userGroupId: userGroupEntity.id, roomId: room.id, schoolId: school.id })
				);
				const roomArrangement = roomArrangementEntityFactory.build({
					userId: teacherUser.id,
					items: rooms.map((room) => {
						return { id: room.id };
					}),
				});
				await em.persistAndFlush([
					...rooms,
					otherRoom,
					studentAccount,
					studentUser,
					teacherAccount,
					teacherUser,
					roomViewerRole,
					userGroupEntity,
					...roomMemberships,
					roomArrangement,
				]);

				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, rooms, otherRoom };
			};

			describe('when the room exists', () => {
				it('should update the room arrangement in the database', async () => {
					const { loggedInClient, teacherUser, rooms } = await setup();

					const response = await loggedInClient.patch('', { id: rooms[1].id, toPosition: 0 });
					expect(response.status).toBe(HttpStatus.NO_CONTENT);

					const updatedArrangement = await em.findOneOrFail(RoomArrangementEntity, {
						userId: teacherUser.id,
					});
					expect(updatedArrangement.items.map((item) => item.id)).toEqual([rooms[1].id, rooms[0].id]);
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.patch('', { id: new ObjectId().toHexString(), toPosition: 0 });
					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the room is not included in the arrangement', () => {
				it('should return a 400 error', async () => {
					const { loggedInClient, otherRoom } = await setup();

					const response = await loggedInClient.patch('', { id: otherRoom.id, toPosition: 0 });

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});

			describe('when the room target postion is negative', () => {
				it('should return a 400 error', async () => {
					const { loggedInClient, rooms } = await setup();

					const response = await loggedInClient.patch('', { id: rooms[1].id, toPosition: -1 });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});

			describe('when the room target postion is out of bounds', () => {
				it('should return a 400 error', async () => {
					const { loggedInClient, rooms } = await setup();

					const response = await loggedInClient.patch('', { id: rooms[1].id, toPosition: rooms.length });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe('when the user does not have the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				await em.persistAndFlush([school, room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.patch('', { id: room.id, toPosition: 0 });
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});
	});
});
