import { EntityManager } from '@mikro-orm/mongodb';
import { CopyApiResponse } from '@modules/copy-helper';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoomEntity } from '@modules/room';
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
import { ShareTokenParentType } from '../../domainobject/share-token.do';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '../../sharing.config';
import { shareTokenFactory } from '../../testing/share-token.factory';

describe('Sharing Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: SharingPublicApiConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'sharetoken');
		config = module.get<SharingPublicApiConfig>(SHARING_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureRoomShare = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /sharetoken/:token/import', () => {
		describe('when the feature is disabled', () => {
			const setup = async () => {
				config.featureRoomShare = false;
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const room = roomEntityFactory.buildWithId();
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomOwnerRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
				});

				const shareToken = shareTokenFactory.build({ parentId: room.id, parentType: ShareTokenParentType.Room });

				await em
					.persist([room, roomMembership, teacherAccount, teacherUser, userGroup, roomOwnerRole, shareToken])
					.flush();

				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient, token: shareToken.token, room };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient, token } = await setup();
				const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is from the same school', () => {
			describe('when the user has the required permissions', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId();

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

					const room = roomEntityFactory.buildWithId({ schoolId: school.id });
					const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
					const userGroup = groupEntityFactory.buildWithId({
						type: GroupEntityTypes.ROOM,
						users: [{ role: roomOwnerRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({
						roomId: room.id,
						userGroupId: userGroup.id,
						schoolId: school.id,
					});

					const shareToken = shareTokenFactory.build({
						parentId: room.id,
						parentType: ShareTokenParentType.Room,
						contextType: undefined,
						contextId: undefined,
					});

					await em
						.persist([room, roomMembership, teacherAccount, teacherUser, userGroup, roomOwnerRole, shareToken])
						.flush();
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient, token: shareToken.token, room };
				};
				it('should return a 201 status', async () => {
					const { loggedInClient, token } = await setup();
					const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
					expect(response.status).toBe(HttpStatus.CREATED);
				});
			});

			describe('when the user does not have the required permissions', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId();
					const room = roomEntityFactory.buildWithId({ schoolId: school.id });
					const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

					const userGroup = groupEntityFactory.buildWithId({
						type: GroupEntityTypes.ROOM,
						users: [{ role: roomOwnerRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({
						roomId: room.id,
						userGroupId: userGroup.id,
						schoolId: school.id,
					});

					const userGroupStudent = groupEntityFactory.buildWithId({
						type: GroupEntityTypes.ROOM,
						users: [{ role: roomViewerRole, user: studentUser }],
					});
					const roomMembershipStudent = roomMembershipEntityFactory.build({
						roomId: room.id,
						userGroupId: userGroupStudent.id,
						schoolId: school.id,
					});

					const shareToken = shareTokenFactory.build({
						parentId: room.id,
						parentType: ShareTokenParentType.Room,
						contextType: undefined,
						contextId: undefined,
					});

					await em
						.persist([
							room,
							roomMembership,
							roomMembershipStudent,
							teacherAccount,
							teacherUser,
							studentAccount,
							studentUser,
							userGroup,
							roomOwnerRole,
							shareToken,
						])
						.flush();
					em.clear();

					const loggedInClientStudent = await testApiClient.login(studentAccount);

					return { loggedInClientStudent, token: shareToken.token, room };
				};
				it('should return a 403 error', async () => {
					const { loggedInClientStudent, token } = await setup();
					const response = await loggedInClientStudent.post(`${token}/import`, { newName: 'NewName' });
					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});

		describe('when the user is from a different school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();

				const room = roomEntityFactory.buildWithId({ schoolId: school.id });
				const { roomOwnerRole, roomAdminRole } = RoomRolesTestFactory.createRoomRoles();

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { teacherAccount: teacherAccountExternal, teacherUser: teacherUserExternal } =
					UserAndAccountTestFactory.buildTeacher({ school: otherSchool });

				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomOwnerRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: school.id,
				});

				const userGroupExternal = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomAdminRole, user: teacherUserExternal }],
				});
				const roomMembershipExternal = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroupExternal.id,
					schoolId: school.id,
				});

				const shareToken = shareTokenFactory.build({
					parentId: room.id,
					parentType: ShareTokenParentType.Room,
					contextType: undefined,
					contextId: undefined,
				});

				await em
					.persist([
						room,
						roomMembership,
						roomMembershipExternal,
						teacherAccount,
						teacherUser,
						teacherAccountExternal,
						teacherUserExternal,
						userGroup,
						roomOwnerRole,
						shareToken,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccountExternal);

				return { loggedInClient, token: shareToken.token, room, teacherUserExternal };
			};

			it('should return a 201', async () => {
				const { loggedInClient, token } = await setup();
				const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
				expect(response.status).toBe(HttpStatus.CREATED);
			});

			it('should actually create a new room with the imported data', async () => {
				const { loggedInClient, token } = await setup();
				const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
				expect(response.status).toBe(HttpStatus.CREATED);

				const roomCopy = response.body as CopyApiResponse;

				const importedRoom = await em.findOneOrFail(RoomEntity, { id: roomCopy.id });
				expect(importedRoom).toBeDefined();
			});

			it('the imported room should belong to external user school', async () => {
				const { loggedInClient, token, teacherUserExternal } = await setup();
				const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });

				const roomCopy = response.body as CopyApiResponse;

				const importedRoom = await em.findOneOrFail(RoomEntity, { id: roomCopy.id });
				expect(importedRoom.schoolId).toEqual(teacherUserExternal.school.id);
			});
		});
	});
});
