import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing';
import { RoomInvitationLinkListResponse } from '../dto/response/room-invitation-link-list.response';
import { AccountEntity } from '@modules/account/repo';
import { User } from '@modules/user';

describe('Room Invitation Link Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /:room-id/room-invitation-links', () => {
		describe('when the user is not authenticated', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.get(someId);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id is not a valid mongo id', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get('42/boards');

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the room does not exist', () => {
			it('should return 404', async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				await em.persist([school, studentAccount, studentUser]).flush();
				const loggedInClient = await testApiClient.login(studentAccount);

				const someId = new ObjectId().toHexString();
				const response = await loggedInClient.get(someId);

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the user is a member of the room', () => {
			const cases = [
				{ userType: 'teacher', roleKey: 'roomOwnerRole', expectedStatus: HttpStatus.OK },
				{ userType: 'teacher', roleKey: 'roomAdminRole', expectedStatus: HttpStatus.OK },
				{ userType: 'teacher', roleKey: 'roomEditorRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'teacher', roleKey: 'roomViewerRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'teacher', roleKey: 'roomApplicantRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'student', roleKey: 'roomOwnerRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'student', roleKey: 'roomAdminRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'student', roleKey: 'roomEditorRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'student', roleKey: 'roomViewerRole', expectedStatus: HttpStatus.FORBIDDEN },
				{ userType: 'student', roleKey: 'roomApplicantRole', expectedStatus: HttpStatus.FORBIDDEN },
			];

			const setup = async (
				userType: 'teacher' | 'student',
				roleKey: keyof ReturnType<typeof RoomRolesTestFactory.createRoomRoles>
			) => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const roomInvitationLinks = roomInvitationLinkEntityFactory.buildList(3, {
					roomId: room.id,
				});
				const roomRoles = RoomRolesTestFactory.createRoomRoles();
				const roomRole = roomRoles[roleKey];

				let account: AccountEntity;
				let user: User;

				if (userType === 'teacher') {
					({ teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher({ school }));
				} else {
					({ studentAccount: account, studentUser: user } = UserAndAccountTestFactory.buildStudent({ school }));
				}

				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomRole, user }],
					organization: user.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em
					.persist([room, ...roomInvitationLinks, account, user, roomRole, userGroupEntity, roomMembership, school])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(account);

				return { loggedInClient, room, roomInvitationLinks };
			};

			it.each(cases)(
				'should return $expectedStatus for $userType with $roleKey',
				async ({ userType, roleKey, expectedStatus }) => {
					const { loggedInClient, room } = await setup(
						userType as 'teacher' | 'student',
						roleKey as keyof ReturnType<typeof RoomRolesTestFactory.createRoomRoles>
					);

					const response = await loggedInClient.get(`/${room.id}/room-invitation-links`);

					if (expectedStatus === HttpStatus.OK) {
						expect(response.status).toBe(HttpStatus.OK);
						expect((response.body as RoomInvitationLinkListResponse).roomInvitationLinks).toHaveLength(3);
					} else {
						expect(response.status).toBe(HttpStatus.FORBIDDEN);
					}
				}
			);
		});

		describe('when the user is not a member of the room', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([room, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			it('should return 403', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.get(`/${room.id}/room-invitation-links`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});
	});
});
