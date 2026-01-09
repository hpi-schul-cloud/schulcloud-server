import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { User } from '@modules/user/repo';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '../../testing';
import { MoveCardBodyParams } from '../dto';

const baseRouteName = '/cards';

describe(`card move to board (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when boards belong to room', () => {
		const setup = async () => {
			const { roomViewerRole, roomEditorRole, roomAdminRole } = RoomRolesTestFactory.createRoomRoles();

			const school = schoolEntityFactory.buildWithId();

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

			const rooms = roomEntityFactory.buildListWithId(2, { schoolId: teacherUser.school.id });

			const columnBoardNodes = columnBoardEntityFactory.buildList(2, {
				context: { id: rooms[0].id, type: BoardExternalReferenceType.Room },
			});
			const columnBoardNodeOnOtherRoom = columnBoardEntityFactory.build({
				context: { id: rooms[1].id, type: BoardExternalReferenceType.Room },
			});
			columnBoardNodes.push(columnBoardNodeOnOtherRoom);

			const fromColumnNode = columnEntityFactory.withParent(columnBoardNodes[0]).build();
			const toColumnNode = columnEntityFactory.withParent(columnBoardNodes[1]).build();
			const toColumnNodeInOtherRoom = columnEntityFactory.withParent(columnBoardNodeOnOtherRoom).build();
			const cardNode = cardEntityFactory.withParent(fromColumnNode).build();

			await em
				.persist([
					teacherUser,
					teacherAccount,
					studentUser,
					studentAccount,
					...rooms,
					...columnBoardNodes,
					fromColumnNode,
					toColumnNode,
					toColumnNodeInOtherRoom,
					cardNode,
				])
				.flush();
			em.clear();

			const createRoomMembership = async (user: User, roomId: EntityId, role: 'viewer' | 'editor' | 'admin') => {
				let userRole: typeof roomViewerRole | typeof roomEditorRole | typeof roomAdminRole;
				if (role === 'viewer') {
					userRole = roomViewerRole;
				} else if (role === 'editor') {
					userRole = roomEditorRole;
				} else {
					userRole = roomAdminRole;
				}

				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: userRole, user }],
				});

				const roomMembership = roomMembershipEntityFactory.build({
					roomId,
					userGroupId: userGroup.id,
					schoolId: teacherUser.school.id,
				});

				await em.persist([userGroup, roomMembership, roomEditorRole]).flush();
				em.clear();
			};

			const loginTeacher = () => testApiClient.login(teacherAccount);
			const loginStudent = () => testApiClient.login(studentAccount);

			return {
				loginTeacher,
				loginStudent,
				createRoomMembership,
				teacherUser,
				studentUser,
				rooms,
				fromColumnNode,
				toColumnNode,
				toColumnNodeInOtherRoom,
				cardNode,
			};
		};

		describe('when moving within the same room', () => {
			describe('and user is admin', () => {
				it('should return status 200', async () => {
					const { loginTeacher, createRoomMembership, teacherUser, rooms, cardNode, toColumnNode } = await setup();

					await createRoomMembership(teacherUser, rooms[0].id, 'admin');

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(200);
				});
			});

			describe('and user is editor', () => {
				it('should return status 200', async () => {
					const { loginTeacher, createRoomMembership, teacherUser, rooms, cardNode, toColumnNode } = await setup();

					await createRoomMembership(teacherUser, rooms[0].id, 'editor');

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(200);
				});
			});

			describe('and user is viewer', () => {
				it('should return status 403', async () => {
					const { loginTeacher, createRoomMembership, teacherUser, rooms, cardNode, toColumnNode } = await setup();

					await createRoomMembership(teacherUser, rooms[0].id, 'viewer');

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(403);
				});
			});

			describe('and user has no room membership', () => {
				it('should return status 403', async () => {
					const { loginStudent, cardNode, toColumnNode } = await setup();

					const loggedInClient = await loginStudent();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(403);
				});
			});
		});

		describe('when moving to another room', () => {
			describe('and user is admin in source room and editor in target room', () => {
				it('should return status 200', async () => {
					const { loginTeacher, createRoomMembership, teacherUser, rooms, cardNode, toColumnNodeInOtherRoom } =
						await setup();

					await createRoomMembership(teacherUser, rooms[0].id, 'admin');
					await createRoomMembership(teacherUser, rooms[1].id, 'editor');

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNodeInOtherRoom.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(200);
				});
			});

			describe('and user is editor in both rooms', () => {
				it('should return status 403', async () => {
					const { loginStudent, createRoomMembership, studentUser, rooms, cardNode, toColumnNodeInOtherRoom } =
						await setup();

					await createRoomMembership(studentUser, rooms[0].id, 'editor');
					await createRoomMembership(studentUser, rooms[1].id, 'editor');

					const loggedInClient = await loginStudent();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNodeInOtherRoom.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(403);
				});
			});

			describe('and user has no room membership', () => {
				it('should return status 403', async () => {
					const { loginTeacher, cardNode, toColumnNodeInOtherRoom } = await setup();

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNodeInOtherRoom.id,
					};
					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(403);
				});
			});
		});
	});

	describe('when board belongs to course', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

			const course = courseEntityFactory.build({
				school: teacherUser.school,
				teachers: [teacherUser],
				students: [studentUser],
			});
			await em.persist([teacherUser, teacherAccount, studentUser, studentAccount, course]).flush();

			const columnBoardNodes = columnBoardEntityFactory.buildList(2, {
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const fromColumnNode = columnEntityFactory.withParent(columnBoardNodes[0]).build();
			const toColumnNode = columnEntityFactory.withParent(columnBoardNodes[1]).build();
			const cardNode = cardEntityFactory.withParent(fromColumnNode).build();

			await em.persist([...columnBoardNodes, fromColumnNode, toColumnNode, cardNode]).flush();
			em.clear();

			const loginTeacher = () => testApiClient.login(teacherAccount);
			const loginStudent = () => testApiClient.login(studentAccount);

			return { loginTeacher, loginStudent, fromColumnNode, toColumnNode, cardNode };
		};

		describe('when moving to another board', () => {
			describe('with valid teacher user', () => {
				it('should return status 200', async () => {
					const { loginTeacher, cardNode, toColumnNode } = await setup();

					const loggedInClient = await loginTeacher();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
						toPosition: 0,
					};

					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(200);
				});
			});

			describe('with valid student user', () => {
				it('should return status 403', async () => {
					const { loginStudent, cardNode, toColumnNode } = await setup();

					const loggedInClient = await loginStudent();

					const params: MoveCardBodyParams = {
						toColumnId: toColumnNode.id,
						toPosition: 0,
					};

					const response = await loggedInClient.put(`${cardNode.id}/position`, params);

					expect(response.status).toEqual(403);
				});
			});
		});
	});
});
