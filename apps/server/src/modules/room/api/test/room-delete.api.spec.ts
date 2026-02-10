import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board/domain/types';
import { BoardNodeEntity } from '@modules/board/repo';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { RoomMembershipEntity } from '@modules/room-membership';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { createRoomWithUserGroup } from '@modules/room/testing/room-with-membership.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { User } from '@modules/user/repo';
import { HttpStatus, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomEntity } from '../../repo';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { waitForEventBus } from './util/wait-for-event-bus';

describe('Room Controller (API)', () => {
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

	describe('DELETE /rooms/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.delete(someId);
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

			it('should return a 400 error', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.delete('42');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required room permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { roomEditorRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount: teacherOwnerAccount, teacherUser: teacherOwnerUser } =
					UserAndAccountTestFactory.buildTeacher({ school });
				const { teacherAccount: teacherEditorAccount, teacherUser: teacherEditorUser } =
					UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomOwnerRole, user: teacherOwnerUser },
						{ role: roomEditorRole, user: teacherEditorUser },
					],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: teacherOwnerUser.school.id,
				});
				const columnBoard = columnBoardEntityFactory.buildWithId({
					context: { type: BoardExternalReferenceType.Room, id: room.id },
				});
				await em
					.persist([
						room,
						roomMembership,
						teacherOwnerAccount,
						teacherOwnerUser,
						teacherEditorAccount,
						teacherEditorUser,
						userGroup,
						roomOwnerRole,
						columnBoard,
					])
					.flush();
				em.clear();

				return { teacherOwnerAccount, teacherEditorAccount, room, columnBoard };
			};

			describe('when the room exists', () => {
				it('should delete the room', async () => {
					const { teacherOwnerAccount, room } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);

					const response = await loggedInClient.delete(room.id);
					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomEntity, room.id)).rejects.toThrow(NotFoundException);
				});

				it('should delete the roomMembership', async () => {
					const { teacherOwnerAccount, room } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);

					await expect(em.findOneOrFail(RoomMembershipEntity, { roomId: room.id })).resolves.not.toThrow();

					const response = await loggedInClient.delete(room.id);
					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomMembershipEntity, { roomId: room.id })).rejects.toThrow(NotFoundException);
				});

				it('should delete the associated boards', async () => {
					const { teacherOwnerAccount, room, columnBoard } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);

					await expect(em.findOneOrFail(BoardNodeEntity, { id: columnBoard.id })).resolves.not.toThrow();

					const response = await loggedInClient.delete(room.id);
					expect(response.status).toBe(HttpStatus.NO_CONTENT);

					await waitForEventBus();
					await expect(em.findOneOrFail(BoardNodeEntity, { id: columnBoard.id })).rejects.toThrow(NotFoundException);
				});

				it('should delete the room content', async () => {
					const { teacherOwnerAccount, room } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);

					await expect(em.findOneOrFail('RoomContentEntity', { roomId: room.id })).resolves.not.toThrow();

					const response = await loggedInClient.delete(room.id);
					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail('RoomContentEntity', { roomId: room.id })).rejects.toThrow(NotFoundException);
				});

				describe('when the room contains a guest teacher from another school', () => {
					describe('when the guest teacher is only in this room', () => {
						it('should remove the secondary school from the guest teacher', async () => {
							const roomSchool = schoolEntityFactory.buildWithId();
							const guestTeacherSchool = schoolEntityFactory.buildWithId();
							const room = roomEntityFactory.build({ schoolId: roomSchool.id });

							const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
							const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
							const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });

							const { teacherAccount: roomOwnerAccount, teacherUser: roomOwnerUser } =
								UserAndAccountTestFactory.buildTeacher({ school: roomSchool });

							const { teacherAccount: guestTeacherAccount, teacherUser: guestTeacherUser } =
								UserAndAccountTestFactory.buildTeacher({ school: guestTeacherSchool });

							guestTeacherUser.secondarySchools.push({
								school: roomSchool,
								role: guestTeacherRole,
							});

							const userGroup = groupEntityFactory.buildWithId({
								type: GroupEntityTypes.ROOM,
								users: [
									{ role: roomOwnerRole, user: roomOwnerUser },
									{ role: roomViewerRole, user: guestTeacherUser },
								],
							});

							const roomMembership = roomMembershipEntityFactory.build({
								roomId: room.id,
								userGroupId: userGroup.id,
								schoolId: roomSchool.id,
							});

							await em
								.persist([
									roomSchool,
									guestTeacherSchool,
									room,
									roomMembership,
									roomOwnerAccount,
									roomOwnerUser,
									guestTeacherAccount,
									guestTeacherUser,
									userGroup,
									roomOwnerRole,
									roomViewerRole,
									teacherRole,
									guestTeacherRole,
								])
								.flush();
							em.clear();

							const guestTeacherBefore = await em.findOneOrFail(User, guestTeacherUser.id);
							expect(guestTeacherBefore.secondarySchools).toHaveLength(1);
							expect(guestTeacherBefore.secondarySchools[0].school.id).toBe(roomSchool.id);

							const loggedInClient = await testApiClient.login(roomOwnerAccount);

							const response = await loggedInClient.delete(room.id);
							expect(response.status).toBe(HttpStatus.NO_CONTENT);

							em.clear();

							const guestTeacherAfter = await em.findOneOrFail(User, guestTeacherUser.id);
							expect(guestTeacherAfter.secondarySchools).toHaveLength(0);
						});
					});

					describe('when the guest teacher is in multiple rooms', () => {
						describe('when all rooms are in the same school', () => {
							it('should not remove the secondary school from the guest teacher', async () => {
								const roomSchool = schoolEntityFactory.buildWithId();
								const guestTeacherSchool = schoolEntityFactory.buildWithId();
								const roomOne = roomEntityFactory.build({ schoolId: roomSchool.id });
								const roomTwo = roomEntityFactory.build({ schoolId: roomSchool.id });

								const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
								const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
								const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });

								const { teacherAccount: roomOwnerAccount, teacherUser: roomOwnerUser } =
									UserAndAccountTestFactory.buildTeacher({ school: roomSchool });

								const { teacherAccount: guestTeacherAccount, teacherUser: guestTeacherUser } =
									UserAndAccountTestFactory.buildTeacher({ school: guestTeacherSchool });

								guestTeacherUser.secondarySchools.push({
									school: roomSchool,
									role: guestTeacherRole,
								});

								const userGroupOne = groupEntityFactory.buildWithId({
									type: GroupEntityTypes.ROOM,
									organization: roomSchool,
									users: [
										{ role: roomOwnerRole, user: roomOwnerUser },
										{ role: roomViewerRole, user: guestTeacherUser },
									],
								});

								const userGroupTwo = groupEntityFactory.buildWithId({
									type: GroupEntityTypes.ROOM,
									organization: roomSchool,
									users: [
										{ role: roomOwnerRole, user: roomOwnerUser },
										{ role: roomViewerRole, user: guestTeacherUser },
									],
								});

								const roomMembershipOne = roomMembershipEntityFactory.build({
									roomId: roomOne.id,
									userGroupId: userGroupOne.id,
									schoolId: roomSchool.id,
								});

								const roomMembershipTwo = roomMembershipEntityFactory.build({
									roomId: roomTwo.id,
									userGroupId: userGroupTwo.id,
									schoolId: roomSchool.id,
								});

								await em
									.persist([
										roomSchool,
										guestTeacherSchool,
										roomOne,
										roomTwo,
										roomMembershipOne,
										roomMembershipTwo,
										roomOwnerAccount,
										roomOwnerUser,
										guestTeacherAccount,
										guestTeacherUser,
										userGroupOne,
										userGroupTwo,
										roomOwnerRole,
										roomViewerRole,
										teacherRole,
										guestTeacherRole,
									])
									.flush();

								const guestTeacherBefore = await em.findOneOrFail(User, guestTeacherUser.id);
								expect(guestTeacherBefore.secondarySchools).toHaveLength(1);
								expect(guestTeacherBefore.secondarySchools[0].school.id).toBe(roomSchool.id);

								const loggedInClient = await testApiClient.login(roomOwnerAccount);

								const response = await loggedInClient.delete(roomOne.id);
								expect(response.status).toBe(HttpStatus.NO_CONTENT);

								em.clear();

								const guestTeacherAfter = await em.findOneOrFail(User, guestTeacherUser.id);
								expect(guestTeacherAfter.secondarySchools).toHaveLength(1);
								expect(guestTeacherAfter.secondarySchools[0].school.id).toBe(roomSchool.id);
							});
						});

						describe('when rooms are in different schools', () => {
							it('should remove only the relevant secondary school', async () => {
								const roomSchoolA = schoolEntityFactory.buildWithId();
								const roomSchoolB = schoolEntityFactory.buildWithId();
								const guestTeacherSchool = schoolEntityFactory.buildWithId();

								const roomInSchoolA = roomEntityFactory.build({ schoolId: roomSchoolA.id });
								const roomInSchoolB = roomEntityFactory.build({ schoolId: roomSchoolB.id });

								const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
								const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
								const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });

								const { teacherAccount: roomOwnerAccount, teacherUser: roomOwnerUser } =
									UserAndAccountTestFactory.buildTeacher({ school: roomSchoolA });

								const { teacherAccount: roomOwnerBAccount, teacherUser: roomOwnerBUser } =
									UserAndAccountTestFactory.buildTeacher({ school: roomSchoolB });

								const { teacherAccount: guestTeacherAccount, teacherUser: guestTeacherUser } =
									UserAndAccountTestFactory.buildTeacher({ school: guestTeacherSchool });

								guestTeacherUser.secondarySchools.push(
									{ school: roomSchoolA, role: guestTeacherRole },
									{ school: roomSchoolB, role: guestTeacherRole }
								);

								const userGroupA = groupEntityFactory.buildWithId({
									type: GroupEntityTypes.ROOM,
									organization: roomSchoolA,
									users: [
										{ role: roomOwnerRole, user: roomOwnerUser },
										{ role: roomViewerRole, user: guestTeacherUser },
									],
								});

								const userGroupB = groupEntityFactory.buildWithId({
									type: GroupEntityTypes.ROOM,
									organization: roomSchoolB,
									users: [
										{ role: roomOwnerRole, user: roomOwnerBUser },
										{ role: roomViewerRole, user: guestTeacherUser },
									],
								});

								const roomMembershipA = roomMembershipEntityFactory.build({
									roomId: roomInSchoolA.id,
									userGroupId: userGroupA.id,
									schoolId: roomSchoolA.id,
								});

								const roomMembershipB = roomMembershipEntityFactory.build({
									roomId: roomInSchoolB.id,
									userGroupId: userGroupB.id,
									schoolId: roomSchoolB.id,
								});

								await em
									.persist([
										roomSchoolA,
										roomSchoolB,
										guestTeacherSchool,
										roomInSchoolA,
										roomInSchoolB,
										roomMembershipA,
										roomMembershipB,
										roomOwnerAccount,
										roomOwnerUser,
										roomOwnerBAccount,
										roomOwnerBUser,
										guestTeacherAccount,
										guestTeacherUser,
										userGroupA,
										userGroupB,
										roomOwnerRole,
										roomViewerRole,
										teacherRole,
										guestTeacherRole,
									])
									.flush();
								em.clear();

								const guestTeacherBefore = await em.findOneOrFail(User, guestTeacherUser.id);
								expect(guestTeacherBefore.secondarySchools).toHaveLength(2);
								expect(guestTeacherBefore.secondarySchools.map((s) => s.school.id)).toEqual(
									expect.arrayContaining([roomSchoolA.id, roomSchoolB.id])
								);

								const loggedInClient = await testApiClient.login(roomOwnerAccount);

								const response = await loggedInClient.delete(roomInSchoolA.id);
								expect(response.status).toBe(HttpStatus.NO_CONTENT);

								em.clear();

								const guestTeacherAfter = await em.findOneOrFail(User, guestTeacherUser.id);
								expect(guestTeacherAfter.secondarySchools).toHaveLength(1);
								expect(guestTeacherAfter.secondarySchools[0].school.id).toBe(roomSchoolB.id);
							});
						});
					});
				});

				describe('when the room has no guest teachers', () => {
					it('should not trigger guest role removal logic', async () => {
						const roomSchool = schoolEntityFactory.buildWithId();
						const room = roomEntityFactory.build({ schoolId: roomSchool.id });

						const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
						const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });

						const { teacherAccount: roomOwnerAccount, teacherUser: roomOwnerUser } =
							UserAndAccountTestFactory.buildTeacher({ school: roomSchool });

						const { teacherAccount: regularTeacherAccount, teacherUser: regularTeacherUser } =
							UserAndAccountTestFactory.buildTeacher({ school: roomSchool });

						const userGroup = groupEntityFactory.buildWithId({
							type: GroupEntityTypes.ROOM,
							users: [
								{ role: roomOwnerRole, user: roomOwnerUser },
								{ role: roomOwnerRole, user: regularTeacherUser },
							],
						});

						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
							schoolId: roomSchool.id,
						});

						await em
							.persist([
								roomSchool,
								room,
								roomMembership,
								roomOwnerAccount,
								roomOwnerUser,
								regularTeacherAccount,
								regularTeacherUser,
								userGroup,
								roomOwnerRole,
								teacherRole,
							])
							.flush();
						em.clear();

						const loggedInClient = await testApiClient.login(roomOwnerAccount);

						const response = await loggedInClient.delete(room.id);
						expect(response.status).toBe(HttpStatus.NO_CONTENT);

						const regularTeacherAfter = await em.findOneOrFail(User, regularTeacherUser.id);
						expect(regularTeacherAfter.secondarySchools).toHaveLength(0);
					});
				});

				describe('when user is not the roomowner', () => {
					it('should fail', async () => {
						const { teacherEditorAccount, room } = await setup();
						const loggedInClient = await testApiClient.login(teacherEditorAccount);

						const response = await loggedInClient.delete(room.id);

						expect(response.status).toBe(HttpStatus.FORBIDDEN);
					});
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { teacherOwnerAccount } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when the user is an administrator of the school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persist([room, adminAccount, adminUser]).flush();
				em.clear();
				const loggedInClient = await testApiClient.login(adminAccount);
				return { loggedInClient, room };
			};

			it('should delete the room', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.delete(room.id);

				expect(response.status).toBe(HttpStatus.NO_CONTENT);
				await expect(em.findOneOrFail(RoomEntity, room.id)).rejects.toThrow(NotFoundException);
			});
		});

		describe('when the user is an administrator of another school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();
				await em.persist([room, adminAccount, adminUser]).flush();
				em.clear();
				const loggedInClient = await testApiClient.login(adminAccount);
				return { loggedInClient, room };
			};

			it('should throw a forbidden exception', async () => {
				const { loggedInClient, room } = await setup();

				const response = await loggedInClient.delete(room.id);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([room, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room exists', () => {
				it('should return 403', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.delete(room.id);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when having two rooms from the same school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const otherSchool = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const { teacherUser: guestTeacher } = UserAndAccountTestFactory.buildTeacher({
					school: otherSchool,
					secondarySchools: [{ school, role: guestTeacherRole }],
				});
				const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				const {
					roomEntity: room1,
					userGroup: group1,
					roomMembership: roomMembership1,
				} = createRoomWithUserGroup(school, [
					{ role: roomOwnerRole, user: teacherUser },
					{ role: roomViewerRole, user: guestTeacher },
				]);
				const {
					roomEntity: room2,
					userGroup: group2,
					roomMembership: roomMembership2,
				} = createRoomWithUserGroup(school, [
					{ role: roomOwnerRole, user: teacherUser },
					{ role: roomViewerRole, user: guestTeacher },
				]);

				await em
					.persist([
						school,
						otherSchool,
						teacherAccount,
						teacherUser,
						guestTeacher,
						guestTeacherRole,
						room1,
						room2,
						group1,
						group2,
						roomMembership1,
						roomMembership2,
					])
					.flush();
				em.clear();

				return { teacherAccount, guestTeacher, guestTeacherRole, room1, room2 };
			};

			describe('when having a guest teacher in both rooms', () => {
				describe('when deleting both rooms', () => {
					it('should remove the secondarySchool attribute from the guest teacher', async () => {
						const { teacherAccount, guestTeacher, room1, room2 } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						const guestTeacherBefore = await em.findOneOrFail(User, guestTeacher.id);
						expect(guestTeacherBefore.secondarySchools).toHaveLength(1);

						em.clear();

						const response1 = await loggedInClient.delete(room1.id);
						expect(response1.status).toBe(HttpStatus.NO_CONTENT);
						const response2 = await loggedInClient.delete(room2.id);
						expect(response2.status).toBe(HttpStatus.NO_CONTENT);

						em.clear();

						const guestTeacherAfter = await em.findOneOrFail(User, guestTeacher.id);
						expect(guestTeacherAfter.secondarySchools).toHaveLength(0);
					});
				});

				describe('when deleting one of the rooms', () => {
					it('should not remove the secondarySchool attribute from the guest teacher', async () => {
						const { teacherAccount, guestTeacher, guestTeacherRole, room1 } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						const guestTeacherBefore = await em.findOneOrFail(User, guestTeacher.id);
						expect(guestTeacherBefore.secondarySchools).toHaveLength(1);

						em.clear();

						const response = await loggedInClient.delete(room1.id);
						expect(response.status).toBe(HttpStatus.NO_CONTENT);

						em.clear();

						const guestTeacherAfter = await em.findOneOrFail(User, guestTeacher.id);
						expect(guestTeacherAfter.secondarySchools).toHaveLength(1);
						expect(guestTeacherAfter.secondarySchools[0].school.id).toBe(room1.schoolId);
						expect(guestTeacherAfter.secondarySchools[0].role.id).toBe(guestTeacherRole.id);
					});
				});
			});
		});
	});
});
