import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board/domain/types';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomInvitationLinkEntity } from '../../repo';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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
		testApiClient = new TestApiClient(app, 'room-invitation-links');
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('DELETE /room-invitation-links', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.delete().query({ roomInvitationLinkIds: [someId] });
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
				const response = await loggedInClient.delete('').query({
					roomInvitationLinkIds: ['invalid-mongo-id'],
				});
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

					const roomInvitationLinkIds = [roomInvitationLink.id];
					const response = await loggedInClient.delete().query({ roomInvitationLinkIds });

					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLink.id)).rejects.toThrow(
						NotFoundException
					);
				});
			});

			describe('when multiple roomInvitationLinks exist', () => {
				it('should delete the roomInvitationLink', async () => {
					const { teacherOwnerAccount, roomInvitationLink, room } = await setup();
					const additionalLinks = roomInvitationLinkEntityFactory.buildList(3, {
						roomId: room.id,
					});
					await em.persist(additionalLinks).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(teacherOwnerAccount);
					const roomInvitationLinkIds = additionalLinks.map((link) => link.id);

					const response = await loggedInClient.delete().query({ roomInvitationLinkIds });

					expect(response.status).toBe(HttpStatus.NO_CONTENT);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLinkIds[0])).rejects.toThrow(
						NotFoundException
					);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLinkIds[1])).rejects.toThrow(
						NotFoundException
					);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLinkIds[2])).rejects.toThrow(
						NotFoundException
					);
					await expect(em.findOneOrFail(RoomInvitationLinkEntity, roomInvitationLink.id)).resolves.toBeDefined();
				});
			});

			describe('when the roomInvitationLink does not exist', () => {
				it('should return a 404 error', async () => {
					const { teacherOwnerAccount } = await setup();
					const loggedInClient = await testApiClient.login(teacherOwnerAccount);
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete().query({ roomInvitationLinkIds: [someId] });

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build();
				const roomInvitationLink = roomInvitationLinkEntityFactory.build({ roomId: room.id });
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([room, roomInvitationLink, teacherAccount, teacherUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, roomInvitationLink };
			};

			describe('when the roomInvitationLink exists', () => {
				it('should return 403', async () => {
					const { loggedInClient, roomInvitationLink } = await setup();

					const response = await loggedInClient.delete().query({
						roomInvitationLinkIds: [roomInvitationLink.id],
					});

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the roomInvitationLink does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.delete().query({ roomInvitationLinkIds: [someId] });

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});
	});
});
