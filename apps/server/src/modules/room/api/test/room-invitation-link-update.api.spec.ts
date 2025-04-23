import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomInvitationLinkEntity } from '../../repo';
import { roomEntityFactory } from '../../testing';
import { UpdateRoomInvitationLinkBodyParams } from '../dto/request/update-room-invitation-link.body.params';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';

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

	describe('PUT /room-invitation-links/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.put(someId);
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
				const someId = new ObjectId().toHexString();
				const params: UpdateRoomInvitationLinkBodyParams = {
					title: 'Room #101',
					activeUntil: new Date(Date.now() + 1000000),
					requiresConfirmation: true,
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: true,
				};
				const response = await loggedInClient.put(someId, params);
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
				const params = { title: 'Room #101', color: 'green' };
				const response = await loggedInClient.put('42', params);
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const roomInvitationLink = roomInvitationLinkEntityFactory.build({
					roomId: room.id,
					creatorSchoolId: school.id,
				});
				const { roomAdminRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					users: [{ role: roomAdminRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: school.id,
				});
				await em.persistAndFlush([
					room,
					roomInvitationLink,
					roomMembership,
					teacherAccount,
					teacherUser,
					userGroup,
					roomAdminRole,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room, roomInvitationLink };
			};

			describe('when the room invitation link does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();
					const params: UpdateRoomInvitationLinkBodyParams = {
						title: 'Room Inivitation renamed',
						activeUntil: new Date(Date.now() + 1000000),
						requiresConfirmation: true,
						isOnlyForTeachers: true,
						restrictedToCreatorSchool: true,
					};

					const response = await loggedInClient.put(someId, params);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the required parameters are given', () => {
				it('should update the room', async () => {
					const { loggedInClient, roomInvitationLink } = await setup();
					const params: UpdateRoomInvitationLinkBodyParams = {
						title: 'Room Inivitation renamed',
						activeUntil: new Date(Date.now() + 1000000),
						requiresConfirmation: true,
						isOnlyForTeachers: true,
						restrictedToCreatorSchool: true,
					};

					const response = await loggedInClient.put(roomInvitationLink.id, params);

					expect(response.status).toBe(HttpStatus.OK);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLink.id)).resolves.toMatchObject({
						id: roomInvitationLink.id,
						title: 'Room Inivitation renamed',
					});
				});
			});
		});

		describe('when the user has not the required permissions', () => {});
	});
});
