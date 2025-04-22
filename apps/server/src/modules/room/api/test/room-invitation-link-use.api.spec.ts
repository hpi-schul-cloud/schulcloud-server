import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import type { ServerConfig } from '@modules/server';
import { ServerTestModule, serverConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

type RoomInvitationLinkConfig = {
	requiresConfirmation?: boolean;
	isOnlyForTeachers?: boolean;
	restrictedToCreatorSchool?: boolean;
	activeUntil?: Date;
};

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

	describe('POST /room-invitation-links/:id', () => {
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

		describe('when the user is at the same school as the user', () => {
			const setup = async (roomInvitationLinkConfig: RoomInvitationLinkConfig) => {
				const school = schoolEntityFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const roomInvitationLink = roomInvitationLinkEntityFactory.buildWithId({
					roomId: new ObjectId().toHexString(),
					requiresConfirmation: roomInvitationLinkConfig.requiresConfirmation ?? true,
					isOnlyForTeachers: roomInvitationLinkConfig.isOnlyForTeachers ?? true,
					restrictedToCreatorSchool: roomInvitationLinkConfig.restrictedToCreatorSchool ?? true,
					activeUntil: roomInvitationLinkConfig.activeUntil ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
					creatorUserId: teacherUser.id,
					creatorSchoolId: school.id,
				});
				await em.persistAndFlush([
					adminAccount,
					adminUser,
					teacherAccount,
					teacherUser,
					studentAccount,
					studentUser,
					roomInvitationLink,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, adminUser, teacherUser, studentUser, roomInvitationLink };
			};

			// each ({RoleName.Teacher, { isOnlyForTeachers: true }, HttpStatus.OK})
			describe('when the user is a teacher', () => {
				describe('when user needs to be a teacher', () => {
					it.only('should return http status okay', async () => {
						const { loggedInClient, roomInvitationLink } = await setup({ isOnlyForTeachers: false });

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

						expect(response.status).toBe(HttpStatus.OK);
					});
				});
			});
		});
	});
});
