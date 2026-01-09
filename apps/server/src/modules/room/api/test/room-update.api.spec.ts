import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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
import { RoomEntity } from '../../repo';
import { roomEntityFactory } from '../../testing';

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

	describe('PUT /rooms/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.put(someId);
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
				const params = { name: 'Room #101', color: 'green' };
				const response = await loggedInClient.put('42', params);
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
					schoolId: school.id,
				});
				const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					users: [{ role: roomEditorRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: school.id,
				});
				await em.persist([room, roomMembership, teacherAccount, teacherUser, userGroup, roomEditorRole]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();
					const params = { name: 'Room #101', color: 'green', features: [] };

					const response = await loggedInClient.put(someId, params);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the required parameters are given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', features: [] };

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
						id: room.id,
						name: 'Room #101',
						color: 'green',
						features: [],
					});
				});

				describe('when name is empty', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: '', color: 'red' };

						const response = await loggedInClient.put(room.id, params);

						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when color is empty', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: '' };

						const response = await loggedInClient.put(room.id, params);

						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when color is not part of the enum', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'fancy-color' };

						const response = await loggedInClient.put(room.id, params);

						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe('when a start date is given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();

					const params = { name: 'Room #101', color: 'green', startDate: '2024-10-02', features: [] };
					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
						id: room.id,
						startDate: new Date('2024-10-02'),
					});
				});

				describe('when the date is invalid', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', startDate: 'invalid date' };
						const response = await loggedInClient.put(room.id, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when the date is null', () => {
					it('should unset the property', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', startDate: null, features: [] };

						const response = await loggedInClient.put(room.id, params);

						expect(response.status).toBe(HttpStatus.OK);
						const resultRoom = await em.findOneOrFail(RoomEntity, room.id);
						expect(resultRoom.startDate).toBe(undefined);
					});
				});
			});

			describe('when the startDate is omitted', () => {
				it('should unset the property', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', features: [] };

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);

					const resultRoom = await em.findOneOrFail(RoomEntity, room.id);
					expect(resultRoom.endDate).toBe(undefined);
				});
			});

			describe('when an end date is given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', endDate: '2024-10-18', features: [] };

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
						id: room.id,
						endDate: new Date('2024-10-18'),
					});
				});

				describe('when the date is invalid', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', endDate: 'invalid date' };
						const response = await loggedInClient.put(room.id, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when the date is null', () => {
					it('should unset the property', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', startDate: '2024-10-02', endDate: null, features: [] };

						const response = await loggedInClient.put(room.id, params);

						expect(response.status).toBe(HttpStatus.OK);

						const resultRoom = await em.findOneOrFail(RoomEntity, room.id);
						expect(resultRoom.endDate).toBe(undefined);
					});
				});
			});

			describe('when the endDate is omitted', () => {
				it('should unset the property', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', startDate: '2024-10-02', features: [] };

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);

					const resultRoom = await em.findOneOrFail(RoomEntity, room.id);
					expect(resultRoom.endDate).toBe(undefined);
				});
			});

			describe('when the start date is before the end date', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();
					const params = {
						name: 'Room #101',
						color: 'green',
						startDate: '2024-10-05',
						endDate: '2024-10-18',
						features: [],
					};

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
						id: room.id,
						startDate: new Date('2024-10-05'),
						endDate: new Date('2024-10-18'),
					});
				});
			});

			describe('when the start date is after the end date', () => {
				it('should return a 400 error', async () => {
					const { loggedInClient, room } = await setup();
					const params = {
						name: 'Room #101',
						color: 'green',
						startDate: '2024-10-10',
						endDate: '2024-10-05',
					};

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build({
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
				});
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([room, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();
					const params = { name: 'Room #101', color: 'green', features: [] };

					const response = await loggedInClient.put(someId, params);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the required parameters are given', () => {
				it('should return a 403 error', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', features: [] };

					const response = await loggedInClient.put(room.id, params);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
