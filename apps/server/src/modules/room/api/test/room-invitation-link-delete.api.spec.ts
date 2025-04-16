import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board/domain/types';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomEntity } from '../../repo';
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
		testApiClient = new TestApiClient(app, 'room-invitation-links');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('DELETE /room-invitation-links/:id', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.delete(someId);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = async () => {
				config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();
				const response = await loggedInClient.delete(someId);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
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
				const response = await loggedInClient.delete('42');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const { roomEditorRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const roomInvitationLink = roomInvitationLinkEntityFactory.build({
					roomId: room.id,
				});
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
				await em.persistAndFlush([
					room,
					roomInvitationLink,
					roomMembership,
					teacherOwnerAccount,
					teacherOwnerUser,
					teacherEditorAccount,
					teacherEditorUser,
					userGroup,
					roomOwnerRole,
					columnBoard,
				]);
				em.clear();

				return { teacherOwnerAccount, teacherEditorAccount, room, roomInvitationLink, columnBoard };
			};

			describe('when the roomInvitationLink exists', () => {
				it('should delete the roomInvitationLink', async () => {
					const { teacherOwnerAccount, roomInvitationLink } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);

					const response = await loggedInClient.delete(roomInvitationLink.id);
					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomEntity, roomInvitationLink.id)).rejects.toThrow(NotFoundException);
				});

				// TODO: describe('when user does not have the permissions', () => {});
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

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const roomInvitationLink = roomEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([roomInvitationLink, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, roomInvitationLink };
			};

			// describe('when the room exists', () => {
			// 	it('should return 403', async () => {
			// 		const { loggedInClient, roomInvitationLink } = await setup();

			// 		const response = await loggedInClient.delete(roomInvitationLink.id);

			// 		expect(response.status).toBe(HttpStatus.FORBIDDEN);
			// 	});
			// });

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete(someId);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});
	});
});
