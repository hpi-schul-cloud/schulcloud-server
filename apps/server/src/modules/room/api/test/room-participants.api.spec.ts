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
import { RoomParticipantListResponse } from '../dto/response/room-participant.response';

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
		const setupRoomWithParticipants = async () => {
			const room = roomEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const role = roleFactory.buildWithId({
				name: RoleName.ROOM_VIEWER,
				permissions: [Permission.ROOM_VIEW],
			});
			// TODO: add more than one user
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user: teacherUser }],
				type: GroupEntityTypes.ROOM,
				organization: teacherUser.school,
				externalSource: undefined,
			});
			const roomMembers = roomMemberEntityFactory.build({ userGroupId: userGroupEntity.id, roomId: room.id });
			await em.persistAndFlush([room, roomMembers, teacherAccount, teacherUser, userGroupEntity]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room };
		};

		const setupLoggedInUser = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);
			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithParticipants();
				const response = await testApiClient.get(`/${room.id}/participants`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			it('should return forbidden error', async () => {
				const { room } = await setupRoomWithParticipants();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.get(`/${room.id}/participants`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		// TODO: test when the feature is disabled
		/* describe('when the feature is disabled', () => {
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
		}); */

		describe('when the user has the required permissions', () => {
			it('should return a list of participants', async () => {
				const { loggedInClient, room } = await setupRoomWithParticipants();

				const response = await loggedInClient.get(`/${room.id}/participants`);

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomParticipantListResponse;
				// TODO: check for actual data
				expect(body.data.length).toBeGreaterThanOrEqual(1);
			});
		});
	});
});
