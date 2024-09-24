import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections } from '@shared/testing';
import { serverConfig, type ServerConfig, ServerTestModule } from '@src/modules/server';
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
				const rooms = roomEntityFactory.buildListWithId(2);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([...rooms, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				const data = rooms.map((room) => {
					return {
						id: room.id,
						name: room.name,
						color: room.color,
						startDate: room.startDate?.toISOString(),
						endDate: room.endDate?.toISOString(),
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

			it('should return a list of rooms', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual(expectedResponse);
			});

			it('should return a list of rooms with pagination', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get().query({ skip: 1, limit: 1 });
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body as RoomListResponse).toEqual({
					data: expectedResponse.data.slice(1),
					limit: 1,
					skip: 1,
					total: 2,
				});
			});

			it('should return an alphabetically sorted list of rooms', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get();
				const rooms = response.body as RoomListResponse;
				expect(rooms.data).toEqual(rooms.data.sort((a, b) => a.name.localeCompare(b.name)));
			});
		});
	});
});
