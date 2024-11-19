import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	groupEntityFactory,
	roleFactory,
} from '@shared/testing';
import { GroupEntityTypes } from '@src/modules/group/entity/group.entity';
import { roomMemberEntityFactory } from '@src/modules/room-member/testing/room-member-entity.factory';
import { ServerTestModule, serverConfig, type ServerConfig } from '@src/modules/server';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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

	describe('PATCH /rooms/:roomId/members/add', () => {
		const setupRoomWithMembers = async () => {
			const room = roomEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
				UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const role = roleFactory.buildWithId({
				name: RoleName.ROOMEDITOR,
				permissions: [Permission.ROOM_VIEW, Permission.ROOM_EDIT],
			});
			// TODO: add more than one user
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user: teacherUser }],
				type: GroupEntityTypes.ROOM,
				organization: teacherUser.school,
				externalSource: undefined,
			});

			const roomMembers = roomMemberEntityFactory.build({ userGroupId: userGroupEntity.id, roomId: room.id });
			await em.persistAndFlush([
				room,
				roomMembers,
				teacherAccount,
				teacherUser,
				otherTeacherUser,
				otherTeacherAccount,
				userGroupEntity,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room, otherTeacherUser };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();
				const response = await testApiClient.patch(`/${room.id}/members/add`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setupLoggedInUser = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient };
			};

			it('should return forbidden error', async () => {
				const { room } = await setupRoomWithMembers();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.patch(`/${room.id}/members/add`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient, room } = await setupRoomWithMembers();
				config.FEATURE_ROOMS_ENABLED = false;

				const response = await loggedInClient.patch(`/${room.id}/members/add`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			it('should return OK', async () => {
				const { loggedInClient, room, otherTeacherUser } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/add`, {
					userIdsAndRoles: [{ userId: otherTeacherUser.id, roleName: RoleName.ROOMEDITOR }],
				});

				expect(response.status).toBe(HttpStatus.OK);
			});
		});
	});
});
