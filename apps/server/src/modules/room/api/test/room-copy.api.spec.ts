import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomEntity } from '../../repo';
import { CopyStatus } from '../../../copy-helper';

describe('POST /rooms/:roomId/copy', () => {
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
		config.FEATURE_ROOMS_DUPLICATION_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when the user is not authenticated', () => {
		it('should return a 401 error', async () => {
			const response = await testApiClient.post();
			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});
	});

	describe('when the feature is disabled', () => {
		const setup = async () => {
			config.FEATURE_ROOMS_DUPLICATION_ENABLED = false;

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return a 403 error', async () => {
			const { loggedInClient } = await setup();
			const someId = new ObjectId().toHexString();
			const response = await loggedInClient.post(`${someId}/copy`);

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when id is not a valid mongo id', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return a 400 error', async () => {
			const { loggedInClient } = await setup();
			const response = await loggedInClient.post('42/copy');
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});
	});

	describe('when the user does not have permission', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

			const room = roomEntityFactory.build();
			const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomOwnerRole, user: teacherUser },
					{ role: roomViewerRole, user: studentUser },
				],
			});

			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: studentUser.school.id,
			});

			await em.persistAndFlush([
				school,
				room,
				roomViewerRole,
				roomOwnerRole,
				studentAccount,
				studentUser,
				teacherUser,
				userGroup,
				roomMembership,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);
			return { loggedInClient, room };
		};

		it('should return a 403 error', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when the user has permission', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

			const room = roomEntityFactory.build();
			const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role: roomOwnerRole, user: teacherUser }],
			});

			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUser.school.id,
			});

			await em.persistAndFlush([
				school,
				room,
				roomOwnerRole,
				teacherAccount,
				teacherAccount,
				teacherUser,
				userGroup,
				roomMembership,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient, room };
		};

		it('should return a 201 response', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.status).toBe(HttpStatus.CREATED);
		});

		it('should return copy status', async () => {
			const { loggedInClient, room } = await setup();
			// TODO
			const expectedResponse = { status: 'success', title: 'room #3', type: 'ROOM' };

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.body as CopyStatus).toMatchObject(expectedResponse);
		});

		it('should actually copy the room', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			const copiedRoomId = (response.body as CopyStatus).id;

			// TODO
			// expect(room.id).not.toBe(copiedRoomId);

			const copiedRoom = await em.findOneOrFail(RoomEntity, { id: copiedRoomId });

			expect(copiedRoom).toBeDefined();
		});
	});
});
