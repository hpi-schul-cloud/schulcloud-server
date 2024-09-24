import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections } from '@shared/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@src/modules/server';
import { RoomEntity } from '../../repo';

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

	describe('POST /rooms', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
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
				const params = { name: 'Room #1', color: 'red' };
				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			describe('when the required parameters are given', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();
					const params = { name: 'Room #1', color: 'red' };

					const response = await loggedInClient.post(undefined, params);
					const roomId = (response.body as { id: string }).id;

					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RoomEntity, roomId)).resolves.toMatchObject({ id: roomId, color: 'red' });
				});
			});

			describe('when a start date is given', () => {
				it('should create the room', async () => {
					const { loggedInClient } = await setup();

					const params = { name: 'Room #1', color: 'red', startDate: '2024-10-01' };
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
					const params = { name: 'Room #1', color: 'red', endDate: '2024-10-20' };

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
	});
});
