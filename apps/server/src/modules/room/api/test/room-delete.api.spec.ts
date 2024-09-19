import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory, cleanupCollections } from '@shared/testing';
import { serverConfig, type ServerConfig, ServerTestModule } from '@src/modules/server';
import { roomEntityFactory } from '../../testing/room-entity.factory';
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

	describe('DELETE /rooms/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.get(someId);
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
				const response = await loggedInClient.delete(someId);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when id is not a valid mongo id', () => {
			const setup = async () => {
				config.FEATURE_ROOMS_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 400 error', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.delete('42');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room exists', () => {
				it.only('should delete the room', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.delete(room.id);

					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomEntity, room.id)).rejects.toThrow(NotFoundException);
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});
	});
});
