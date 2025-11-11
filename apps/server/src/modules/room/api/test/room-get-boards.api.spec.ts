import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing';
import { UserSchoolEmbeddable } from '@modules/user/repo';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';

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

	describe('GET /rooms/:id/boards', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.get(someId);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id is not a valid mongo id', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 400 error', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.get('42/boards');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const board = columnBoardEntityFactory.build({
					context: { type: BoardExternalReferenceType.Room, id: room.id },
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomViewerRole, user: studentUser },
						{ role: roomOwnerRole, user: teacherUser },
					],
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});
				await em.persistAndFlush([
					room,
					board,
					studentAccount,
					studentUser,
					teacherUser,
					roomViewerRole,
					userGroupEntity,
					roomMembership,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, room, board };
			};

			describe('when the room exists', () => {
				it('should return the room boards', async () => {
					const { loggedInClient, room, board } = await setup();

					const response = await loggedInClient.get(`${room.id}/boards`);
					expect(response.status).toBe(HttpStatus.OK);
					expect((response.body as { data: Record<string, unknown> }).data[0]).toEqual({
						id: board.id,
						title: board.title,
						layout: board.layout,
						isVisible: board.isVisible,
						createdAt: board.createdAt.toISOString(),
						updatedAt: board.updatedAt.toISOString(),
					});
				});

				describe('when room content does not exist in db', () => {
					it('should create one', async () => {
						const { loggedInClient, room, board } = await setup();

						await em.nativeDelete('RoomContentEntity', { roomId: room.id });

						await loggedInClient.get(`${room.id}/boards`);

						const roomContent = await em.findOneOrFail('RoomContentEntity', { roomId: room.id });
						expect(roomContent['items']).toHaveLength(1);
						expect(roomContent['items']).toEqual([
							{
								id: board.id,
								type: 'board',
							},
						]);
					});
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.get(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room exists', () => {
				it('should return 403', async () => {
					const { loggedInClient, room } = await setup();

					const response = await loggedInClient.get(room.id);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});

		describe('when a teacher from a foreign school is added to the room', () => {
			const setup = async () => {
				const schoolA = schoolEntityFactory.buildWithId();
				const schoolB = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: schoolA.id });
				const board = columnBoardEntityFactory.build({
					context: { type: BoardExternalReferenceType.Room, id: room.id },
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school: schoolA });
				const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const { teacherUser: teacherUserA, teacherAccount: teacherAccountA } = UserAndAccountTestFactory.buildTeacher({
					school: schoolA,
				});
				const userSchoolEmbeddable = new UserSchoolEmbeddable({ school: schoolA, role: guestTeacherRole });
				const { teacherUser: foreignTeacherUser, teacherAccount: foreignTeacherAccount } =
					UserAndAccountTestFactory.buildTeacher({
						school: schoolB,
						secondarySchools: [userSchoolEmbeddable],
					});
				const { roomViewerRole, roomOwnerRole, roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
				const userGroupEntity = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [
						{ role: roomViewerRole, user: studentUser },
						{ role: roomOwnerRole, user: teacherUserA },
						{ role: roomEditorRole, user: foreignTeacherUser },
					],
					organization: studentUser.school,
					externalSource: undefined,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: schoolA.id,
				});
				await em.persistAndFlush([
					room,
					board,
					studentAccount,
					studentUser,
					teacherUserA,
					teacherAccountA,
					foreignTeacherUser,
					foreignTeacherAccount,
					roomViewerRole,
					roomOwnerRole,
					userGroupEntity,
					roomMembership,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(foreignTeacherAccount);

				return { loggedInClient, room, board };
			};

			it('should allow the foreign teacher to list the room boards', async () => {
				const { loggedInClient, room, board } = await setup();
				const response = await loggedInClient.get(`${room.id}/boards`);
				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as { data: Record<string, unknown> }).data[0]).toEqual({
					id: board.id,
					title: board.title,
					layout: board.layout,
					isVisible: board.isVisible,
					createdAt: board.createdAt.toISOString(),
					updatedAt: board.updatedAt.toISOString(),
				});
			});
		});
	});
});
