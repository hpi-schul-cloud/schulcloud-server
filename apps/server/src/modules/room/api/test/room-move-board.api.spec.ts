import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomContentType } from '@modules/room/domain';
import { roomContentEntityFactory, roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

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

	describe('PATCH /rooms/:id/boards', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.patch(`${someId}/boards`);
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
				const response = await loggedInClient.patch('42/boards');
				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const boards = columnBoardEntityFactory.buildList(2, {
					context: { type: BoardExternalReferenceType.Room, id: room.id },
				});
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
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
					...boards,
					studentAccount,
					studentUser,
					teacherAccount,
					teacherUser,
					roomViewerRole,
					userGroupEntity,
					roomMembership,
				]);

				const roomContent = roomContentEntityFactory.build({
					roomId: room.id,
					items: boards.map((board) => {
						return { id: board.id, type: RoomContentType.BOARD };
					}),
				});
				await em.persistAndFlush(roomContent);

				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room, boards };
			};

			describe('when the room exists', () => {
				it('should update room content order in the database', async () => {
					const { loggedInClient, room, boards } = await setup();

					const response = await loggedInClient.patch(`${room.id}/boards`, { id: boards[1].id, toPosition: 0 });
					expect(response.status).toBe(HttpStatus.NO_CONTENT);

					const roomContent = await em.findOneOrFail('RoomContentEntity', { roomId: room.id });
					expect(roomContent['items']).toEqual([
						{ id: boards[1].id, type: RoomContentType.BOARD },
						{ id: boards[0].id, type: RoomContentType.BOARD },
					]);
				});

				describe('when the board does not exist in the room', () => {
					it('should return a 404 error', async () => {
						const { loggedInClient, room } = await setup();
						const someBoard = columnBoardEntityFactory.buildWithId();

						await em.persistAndFlush(someBoard);
						em.clear();

						const response = await loggedInClient.patch(`${room.id}/boards`, { id: someBoard.id, toPosition: 0 });

						expect(response.status).toBe(HttpStatus.NOT_FOUND);
					});
				});

				describe('when the position is < 0', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room, boards } = await setup();

						const response = await loggedInClient.patch(`${room.id}/boards`, { id: boards[0].id, toPosition: -1 });

						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});

				describe('when the position exceeds content length', () => {
					it('should return a 400 error', async () => {
						const { loggedInClient, room, boards } = await setup();

						const response = await loggedInClient.patch(`${room.id}/boards`, { id: boards[0].id, toPosition: 2 });

						expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient, boards } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.patch(`${someId}/boards`, { id: boards[0].id, toPosition: 0 });

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when the user has not the required permissions', () => {
			const setup = async () => {
				const room = roomEntityFactory.build({
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
				});
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([room, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room };
			};

			describe('when the room does not exist', () => {
				it('should return a 404 error', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();
					const params = { id: new ObjectId().toHexString(), toPosition: 0 };

					const response = await loggedInClient.patch(`${someId}/boards`, params);

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when the required parameters are given', () => {
				it('should return a 403 error', async () => {
					const { loggedInClient, room } = await setup();
					const params = { id: new ObjectId().toHexString(), toPosition: 0 };

					const response = await loggedInClient.patch(`${room.id}/boards`, params);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
