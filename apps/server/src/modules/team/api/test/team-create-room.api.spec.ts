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
import { SchoolEntity } from '@modules/school/repo';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';

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
	});

	afterAll(async () => {
		await app.close();
	});

	const setupUser = (props: { isTeacher: boolean; school: SchoolEntity }) => {
		if (props.isTeacher) {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: props.school });
			return { account: teacherAccount, user: teacherUser };
		} else {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school: props.school });
			return { account: studentAccount, user: studentUser };
		}
	};

	const setupTeamWithUser = async (props: { isTeacher: boolean; isTeamOwner: boolean }) => {
		const school = schoolEntityFactory.buildWithId();

		const { account, user } = setupUser({ isTeacher: props.isTeacher, school });

		const teamRole = roleFactory.buildWithId({
			name: props.isTeamOwner ? RoleName.TEAMOWNER : RoleName.TEAMADMINISTRATOR,
			permissions: props.isTeamOwner ? [Permission.TEAM_EXPORT_TO_ROOM] : [],
		});
		const team = teamFactory.buildWithId({
			teamUsers: [new TeamUserEntity({ role: teamRole, user, school })],
		});

		const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

		await em.persist([school, account, user, team, teamRole, roomViewerRole, roomOwnerRole]).flush();
		em.clear();

		const loggedInClient = await testApiClient.login(account);

		return { loggedInClient, team, user };
	};

	describe('POST /:teamId/create-room', () => {
		describe('when a teacher is owner of the team', () => {
			it('should return a 201 response with the created room ID', async () => {
				const { loggedInClient, team } = await setupTeamWithUser({ isTeacher: true, isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.CREATED);
				expect(response.body).toHaveProperty('roomId');
			});

			it('should create a room with the correct name', async () => {
				const { loggedInClient, team } = await setupTeamWithUser({ isTeacher: true, isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);
				const body = response.body as { roomId: string };
				expect(body.roomId).toBeDefined();

				const room = await app.get(RoomService).getSingleRoom(body.roomId);
				expect(room.name).toEqual(team.name);
			});

			it('should add user as owner to the room', async () => {
				const { loggedInClient, team, user } = await setupTeamWithUser({ isTeacher: true, isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);
				const body = response.body as { roomId: string };
				expect(body.roomId).toBeDefined();

				const roomMembers = await app.get(RoomMembershipService).getRoomMembers(body.roomId);
				const userInRoom = roomMembers.find((member) => member.userId === user.id);
				expect(roomMembers).toBeDefined();
				expect(userInRoom).toBeDefined();
				expect(userInRoom?.roomRoleName).toEqual(RoleName.ROOMOWNER);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return 403', async () => {
				config.featureTeamCreateRoomEnabled = false;
				const { loggedInClient, team } = await setupTeamWithUser({ isTeacher: true, isTeamOwner: true });

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

		describe('when the user not in the team', () => {
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
				const { loggedInClient, team } = await setupTeamWithUser({ isTeacher: true, isTeamOwner: false });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is not a teacher', () => {
			it('should return a 403 response since the user is not allowed to create Rooms', async () => {
				const { loggedInClient, team } = await setupTeamWithUser({ isTeacher: false, isTeamOwner: true });

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
