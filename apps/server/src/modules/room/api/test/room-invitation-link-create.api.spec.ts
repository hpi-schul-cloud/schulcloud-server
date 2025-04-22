import { EntityManager } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import type { ServerConfig } from '@modules/server';
import { ServerTestModule, serverConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { CreateRoomInvitationLinkBodyParams } from '../dto/request/create-room-invitation-link.body.params';

describe('Room Invitation Link Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'room-invitation-links');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /room-invitation-links', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient } = await setup();
				const params = {
					title: 'Room invitation link',
					roomId: 'roomId',
					requiresConfirmation: true,
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: true,
					activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
				};
				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the request is valid', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser };
			};

			it('should create a room invitation link and return 201', async () => {
				const { loggedInClient } = await setup();
				const params: CreateRoomInvitationLinkBodyParams = {
					roomId: 'validRoomId',
					title: 'Room invitation link for teachers of my school',
					activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: true,
					requiresConfirmation: false,
				};

				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.CREATED);
				expect(response.body).toMatchObject({
					...params,
					activeUntil: params.activeUntil!.toISOString(),
					id: expect.anything() as string,
					creatorUserId: expect.anything() as string,
					creatorSchoolId: expect.anything() as string,
				});
			});
		});

		describe('when the request is invalid', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser };
			};

			it('should responsed with bad request error 400', async () => {
				const { loggedInClient } = await setup();
				const params = {
					roomId: 'validRoomId',
					startingRole: RoleName.ROOMVIEWER,
				};
				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
