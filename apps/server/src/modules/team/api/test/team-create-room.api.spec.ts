import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { TeamUserEntity } from '../../repo';
import { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from '../../team.config';
import { teamFactory } from '@modules/team/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Room, RoomEntity, RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { userFactory } from '@modules/user/testing';
import { User } from '@modules/user';

describe('Team Export Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: TeamPublicApiConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'teams');
		config = moduleFixture.get<TeamPublicApiConfig>(TEAM_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureTeamCreateRoomEnabled = true;
		await em.clearCache('roles-cache-bynames-roomowner');
		await em.clearCache('roles-cache-bynames-roomviewer');
		await em.clearCache('roles-cache-byname-guestStudent');
		await em.clearCache('roles-cache-byname-guestTeacher');
		await em.clearCache('roles-cache-byname-guestExternalPerson');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /:teamId/create-room', () => {
		describe('when a teacher is owner of the team', () => {
			it('should return a 201 response', async () => {
				const { loggedInClient, teamId } = await setupTeamWithUser({ rolename: 'teacher', isTeamOwner: true });

				const response = await loggedInClient.post(`${teamId}/create-room`);

				expect(response.status).toBe(HttpStatus.CREATED);
			});

			it('should create a room with the correct name', async () => {
				const { loggedInClient, teamId, team } = await setupTeamWithUser({ rolename: 'teacher', isTeamOwner: true });

				const { roomId } = await createRoomViaApi({ teamId, loggedInClient });

				const room = await app.get(RoomService).getSingleRoom(roomId);
				expect(room.name).toEqual(team.name);
			});

			it('should add user as owner to the room', async () => {
				const { loggedInClient, teamId, user } = await setupTeamWithUser({ rolename: 'teacher', isTeamOwner: true });

				const { roomId } = await createRoomViaApi({ teamId, loggedInClient });

				const userRoomRole = await fetchUsersRoleInRoom({ userId: user.id, roomId: roomId });
				expect(userRoomRole).toEqual(RoleName.ROOMOWNER);
			});

			it('should add other users of team as viewers to room', async () => {
				const { loggedInClient, teamId, otherUsers } = await setupTeamWithUser({
					rolename: 'teacher',
					isTeamOwner: true,
				});

				const { roomId } = await createRoomViaApi({ teamId, loggedInClient });

				const otherUserRoles = await Promise.all(
					otherUsers.map((otherUser) => fetchUsersRoleInRoom({ userId: otherUser.id, roomId }))
				);
				expect(otherUserRoles.every((role) => role === RoleName.ROOMVIEWER)).toBe(true);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return 403', async () => {
				config.featureTeamCreateRoomEnabled = false;
				const { loggedInClient, team } = await setupTeamWithUser({ rolename: 'teacher', isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.post(`${someId}/create-room`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user is not in the team', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const team = teamFactory.buildWithId();

				await em.persist([school, teacherAccount, teacherUser, team]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, team };
			};

			it('should return a 403 response since the user is not in the team', async () => {
				const { loggedInClient, team } = await setup();

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is admin in the team', () => {
			it('should return a 403 response since the user is not a owner in the team', async () => {
				const { loggedInClient, team } = await setupTeamWithUser({ rolename: 'teacher', isTeamOwner: false });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is not a teacher', () => {
			it('should return a 403 response since the user is not allowed to create Rooms', async () => {
				const { loggedInClient, team } = await setupTeamWithUser({ rolename: 'student', isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when migration fails at a later step', () => {
			it('should roll back the room', async () => {
				const { loggedInClient, teamId, otherUsers } = await setupTeamWithUser({
					rolename: 'teacher',
					isTeamOwner: true,
				});

				await em.nativeDelete(User, otherUsers[0].id);

				const response = await loggedInClient.post(`${teamId}/create-room`);
				expect(response.status).toEqual(400);

				const rooms = await em.findAll(RoomEntity);
				expect(rooms.length).toEqual(0);
			});
		});
	});

	const setupTeamWithUser = async (props: { rolename: 'teacher' | 'student'; isTeamOwner: boolean }) => {
		const { account, user } = UserAndAccountTestFactory.buildByRole(props.rolename);
		const { school } = user;

		const userTeamRole = roleFactory.buildWithId({
			name: props.isTeamOwner ? RoleName.TEAMOWNER : RoleName.TEAMADMINISTRATOR,
			permissions: props.isTeamOwner ? [Permission.TEAM_EXPORT_TO_ROOM] : [],
		});
		const otherTeamRole = roleFactory.buildWithId({
			name: RoleName.TEAMMEMBER,
			permissions: [],
		});
		const otherUsers = userFactory.asTeacher().buildListWithId(3, { school });
		const team = teamFactory.buildWithId({
			teamUsers: [
				new TeamUserEntity({ role: userTeamRole, user, school }),
				...otherUsers.map((teamUser) => new TeamUserEntity({ role: otherTeamRole, user: teamUser, school })),
			],
		});

		const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
		const guestRoles = [
			roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT }),
			roleFactory.buildWithId({ name: RoleName.GUESTTEACHER }),
			roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON }),
		];

		await em
			.persist([
				school,
				account,
				user,
				...otherUsers,
				team,
				userTeamRole,
				otherTeamRole,
				roomViewerRole,
				roomOwnerRole,
				...guestRoles,
			])
			.flush();
		em.clear();

		const loggedInClient = await testApiClient.login(account);

		return { loggedInClient, team, teamId: team.id, user, otherUsers };
	};

	const fetchUsersRoleInRoom = async (props: { userId: string; roomId: string }) => {
		expect(props.userId).toBeDefined();
		expect(props.roomId).toBeDefined();

		const roomMembers = await app.get(RoomMembershipService).getRoomMembers(props.roomId);
		const userInRoom = roomMembers.find((member) => member.userId === props.userId);
		return userInRoom?.roomRoleName;
	};

	const createRoomViaApi = async (props: {
		teamId: string;
		loggedInClient: TestApiClient;
	}): Promise<{ status: number; roomId: string }> => {
		const response = await props.loggedInClient.post(`${props.teamId}/create-room`);
		expect(response.status).toEqual(201);

		const body = response.body as { roomId: string };
		expect(body.roomId).toBeDefined();

		return { status: response.status, roomId: body.roomId };
	};
});
