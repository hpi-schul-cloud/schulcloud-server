import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections } from '@shared/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@src/modules/server';
import { RoomEntity } from '../../repo';
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

	describe('PATCH /rooms/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.patch(someId);
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
				const params = { name: 'Room #101', color: 'green' };
				const response = await loggedInClient.patch(someId, params);
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
				const params = { name: 'Room #101', color: 'green' };
				const response = await loggedInClient.patch('42', params);
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build({
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
				});
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();
					const params = { name: 'Room #101', color: 'green' };

					const response = await loggedInClient.patch(someId, params);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the required parameters are given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green' };

					const response = await loggedInClient.patch(room.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
						id: room.id,
						name: 'Room #101',
						color: 'green',
					});
				});
			});

			describe('when a start date is given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();

					const params = { name: 'Room #101', color: 'green', startDate: '2024-10-02' };
					const response = await loggedInClient.patch(room.id, params);

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
						const response = await loggedInClient.patch(room.id, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when the date is null', () => {
					it('should unset the property', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', startDate: null };

						const response = await loggedInClient.patch(room.id, params);

						expect(response.status).toBe(HttpStatus.OK);
						await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
							id: room.id,
							startDate: null,
						});
					});
				});
			});

			describe('when an end date is given', () => {
				it('should update the room', async () => {
					const { loggedInClient, room } = await setup();
					const params = { name: 'Room #101', color: 'green', endDate: '2024-10-18' };

					const response = await loggedInClient.patch(room.id, params);

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
						const response = await loggedInClient.patch(room.id, params);
						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when the date is null', () => {
					it('should unset the property', async () => {
						const { loggedInClient, room } = await setup();
						const params = { name: 'Room #101', color: 'green', endDate: null };

						const response = await loggedInClient.patch(room.id, params);

						expect(response.status).toBe(HttpStatus.OK);
						await expect(em.findOneOrFail(RoomEntity, room.id)).resolves.toMatchObject({
							id: room.id,
							endDate: null,
						});
					});
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
					};

					const response = await loggedInClient.patch(room.id, params);

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

					const response = await loggedInClient.patch(room.id, params);

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
});
