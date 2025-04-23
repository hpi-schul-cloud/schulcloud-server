import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntity, GroupUserEmbeddable } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { RoomMembershipEntity } from '@modules/room-membership';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import type { ServerConfig } from '@modules/server';
import { ServerTestModule, serverConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomProps } from '../../../room/domain';
import { RoomEntity } from '../../../room/repo';
import { CreateRoomInvitationLinkBodyParams } from '../dto/request/create-room-invitation-link.body.params';

const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

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

	const createRoomWithGroupEntity = async (
		roomProps: Partial<RoomProps> = {},
		users: GroupUserEmbeddable[]
	): Promise<{
		roomEntity: RoomEntity;
		roomMembership: RoomMembershipEntity;
		userGroupEntity: GroupEntity;
	}> => {
		const owner = users[0].user;
		const userGroupEntity = groupEntityFactory.withTypeRoom().buildWithId({ users });
		const schoolId = owner.school?.id;
		const roomEntity = roomEntityFactory.buildWithId({ ...roomProps, schoolId });
		const roomMembership = roomMembershipEntityFactory.build({
			roomId: roomEntity.id,
			userGroupId: userGroupEntity.id,
			schoolId: roomEntity.schoolId,
		});
		roomEntity._id = new ObjectId(roomEntity.id);

		await em.persistAndFlush([roomEntity, userGroupEntity, roomMembership]);
		em.clear();

		return { roomEntity, roomMembership, userGroupEntity };
	};

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
					activeUntil: inOneWeek,
				};
				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the request is valid', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				await em.persistAndFlush([school, teacherAccount, teacherUser, roomOwnerRole]);
				em.clear();

				const { roomEntity } = await createRoomWithGroupEntity({}, [
					{
						user: teacherUser,
						role: roomOwnerRole,
					},
				]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, roomEntity };
			};

			it('should create a room invitation link and return 201', async () => {
				const { loggedInClient, roomEntity } = await setup();

				const params: CreateRoomInvitationLinkBodyParams = {
					roomId: roomEntity.id,
					title: 'Room invitation link for teachers',
					activeUntil: inOneWeek,
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: false,
					requiresConfirmation: false,
				};

				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.CREATED);
				expect(response.body).toMatchObject({
					...params,
					activeUntil: (params.activeUntil ?? new Date()).toISOString(),
					id: expect.anything() as string,
					creatorUserId: expect.anything() as string,
					creatorSchoolId: expect.anything() as string,
				});
			});
		});

		describe('when the user does not have the correct permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				await em.persistAndFlush([teacherAccount, teacherUser, roomViewerRole]);
				em.clear();

				const { roomEntity } = await createRoomWithGroupEntity({}, [
					{
						user: teacherUser,
						role: roomViewerRole,
					},
				]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, roomEntity };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient, roomEntity } = await setup();

				const params: CreateRoomInvitationLinkBodyParams = {
					roomId: roomEntity.id,
					title: 'Room invitation link for teachers of my school',
					activeUntil: inOneWeek,
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: true,
					requiresConfirmation: false,
				};

				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
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
