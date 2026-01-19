import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '../../registration.config';
import { registrationEntityFactory } from '../../testing/registration-entity.factory';
import { RegistrationListResponse } from '../dto/response/registration-list.response';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: RegistrationPublicApiConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'registrations');

		config = moduleFixture.get<RegistrationPublicApiConfig>(REGISTRATION_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureExternalPersonRegistrationEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /registrations/by-room/:roomId', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const roomOne = roomEntityFactory.buildWithId({ schoolId: school.id });
			const roomTwo = roomEntityFactory.buildWithId({ schoolId: school.id });
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntityOne = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomViewerRole, user: studentUser },
					{ role: roomOwnerRole, user: teacherUser },
				],
				organization: studentUser.school,
				externalSource: undefined,
			});
			const userGroupEntityTwo = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				organization: studentUser.school,
				externalSource: undefined,
			});
			const roomMembershipOne = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntityOne.id,
				roomId: roomOne.id,
				schoolId: school.id,
			});
			const roomMembershipTwo = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntityTwo.id,
				roomId: roomTwo.id,
				schoolId: school.id,
			});

			const registrationOne = registrationEntityFactory.build({
				roomIds: [roomOne.id],
			});
			const registrationTwo = registrationEntityFactory.build({
				roomIds: [roomOne.id, roomTwo.id],
			});
			const registrationThree = registrationEntityFactory.build({
				roomIds: [roomTwo.id],
			});

			await em
				.persist([
					roomOne,
					roomTwo,
					registrationOne,
					registrationTwo,
					registrationThree,
					school,
					studentAccount,
					studentUser,
					teacherAccount,
					teacherUser,
					userGroupEntityOne,
					userGroupEntityTwo,
					roomMembershipOne,
					roomMembershipTwo,
				])
				.flush();
			em.clear();

			return {
				registrationOne,
				registrationTwo,
				registrationThree,
				roomOne,
				roomTwo,
				studentAccount,
				studentUser,
				teacherAccount,
			};
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.featureExternalPersonRegistrationEnabled = false;
				const { roomOne, teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const response = await loggedInClient.get(`/by-room/${roomOne.id}`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when registrations exist for the room', () => {
			describe('when the user has the required permissions', () => {
				it('should return the registrations for the room', async () => {
					const { registrationOne, registrationTwo, registrationThree, roomOne, teacherAccount } = await setup();
					const loggedInClient = await testApiClient.login(teacherAccount);

					const response = await loggedInClient.get(`/by-room/${roomOne.id}`);
					const responseBody = response.body as RegistrationListResponse;

					expect(response.status).toBe(HttpStatus.OK);
					expect(responseBody.data).toHaveLength(2);
					const registrationIds = responseBody.data.map((reg: { id: string }) => reg.id);
					expect(registrationIds).toContain(registrationOne.id);
					expect(registrationIds).toContain(registrationTwo.id);
					expect(registrationIds).not.toContain(registrationThree.id);
				});
			});

			describe('when the user does not have the required permissions', () => {
				it('should return a 403 error', async () => {
					const { roomOne, studentAccount } = await setup();
					const loggedInClient = await testApiClient.login(studentAccount);

					const response = await loggedInClient.get(`/by-room/${roomOne.id}`);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});

		describe('when no registrations exist for the room', () => {
			it('should return a 404 error', async () => {
				const { teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const randomRoomId = new ObjectId().toHexString();
				const response = await loggedInClient.get(`/by-room/${randomRoomId}`);

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when requesting with an invalid roomId', () => {
			it('should return a 400 error', async () => {
				const { teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const randomInvalidRoomId = 'someInvalidRoomId';
				const response = await loggedInClient.get(`/by-room/${randomInvalidRoomId}`);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
