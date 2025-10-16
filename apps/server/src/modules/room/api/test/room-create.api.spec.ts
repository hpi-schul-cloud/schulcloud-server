import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntity } from '@modules/group/entity';
import { RoomMembershipEntity } from '@modules/room-membership';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomEntity } from '../../repo';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';

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

	describe('POST /rooms', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { roomEditorRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				await em.persistAndFlush([teacherAccount, teacherUser, roomEditorRole, roomOwnerRole]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, roomEditorRole };
			};

			describe('when the required parameters are given', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();
					const params = { name: 'Room #1', color: 'red', features: [] };

					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;
					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RoomEntity, roomId)).resolves.toMatchObject({ id: roomId, color: 'red' });
				});

				it('should have room creator as room editor', async () => {
					const { loggedInClient, teacherUser } = await setup();

					const params = { name: 'Room #1', color: 'red', features: [] };

					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;
					const roomMembership = await em.findOneOrFail(RoomMembershipEntity, { roomId });

					const userGroup = await em.findOneOrFail(GroupEntity, {
						id: roomMembership.userGroupId,
					});

					expect(roomMembership).toBeDefined();
					expect(userGroup).toBeDefined();
					expect(userGroup.users).toHaveLength(1);
					expect(userGroup.users[0].user.id).toBe(teacherUser.id);
				});
			});

			describe('when a start date is given', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();

					const params = { name: 'Room #1', color: 'red', startDate: '2024-10-01', features: [] };
					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;

					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RoomEntity, roomId)).resolves.toMatchObject({
						id: roomId,
						startDate: new Date('2024-10-01'),
					});
				});

				describe('when the date is invalid', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient } = await setup();
						const params = { name: 'Room #1', color: 'red', startDate: 'invalid date' };
						const response = await loggedInClient.post(undefined, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe('when an end date is given', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();
					const params = { name: 'Room #1', color: 'red', endDate: '2024-10-20', features: [] };

					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;

					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RoomEntity, roomId)).resolves.toMatchObject({
						id: roomId,
						endDate: new Date('2024-10-20'),
					});
				});

				describe('when the date is invalid', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient } = await setup();
						const params = { name: 'Room #1', color: 'red', endDate: 'invalid date' };
						const response = await loggedInClient.post(undefined, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe('when the start date is before the end date', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();
					const params = {
						name: 'Room #1',
						color: 'red',
						startDate: '2024-10-01',
						endDate: '2024-10-20',
						features: [],
					};

					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;

					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RoomEntity, roomId)).resolves.toMatchObject({
						id: roomId,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2024-10-20'),
					});
				});
			});

			describe('when the start date is after the end date', () => {
				it('should return a 400 error', async () => {
					const { loggedInClient } = await setup();
					const params = {
						name: 'Room #1',
						color: 'red',
						startDate: '2024-10-20',
						endDate: '2024-10-01',
					};

					const response = await loggedInClient.post(undefined, params);

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe('when the user has not required permissions', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			describe('when the required parameters are given', () => {
				it('should not create the room', async () => {
					const { loggedInClient } = await setup();
					const params = { name: 'Room #1', color: 'red', features: [] };

					const response = await loggedInClient.post(undefined, params);
					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});
	});
});
