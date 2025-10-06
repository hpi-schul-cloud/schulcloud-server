import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, ContentElementType, ElementReferenceType } from '../../domain';
import { columnBoardEntityFactory, fileFolderElementEntityFactory } from '../../testing';
import { ElementWithParentHierarchyResponse } from '../dto';

describe(`getElementWithParentHierarchy (api)`, () => {
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
		testApiClient = new TestApiClient(app, 'elements');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('with valid user', () => {
		describe('when root parent is course', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, teacherAccount, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const fileFolderElement = fileFolderElementEntityFactory.withParent(columnBoardNode).build();

				await em.persistAndFlush([columnBoardNode, fileFolderElement]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					fileFolderElement,
					columnBoardNode,
					course,
				};
			};

			it('should return status 200', async () => {
				const { loggedInClient, fileFolderElement } = await setup();

				const response = await loggedInClient.get(fileFolderElement.id);

				expect(response.statusCode).toEqual(200);
			});

			it('should return the correct response', async () => {
				const { loggedInClient, fileFolderElement, course, columnBoardNode } = await setup();

				const result = await loggedInClient.get(fileFolderElement.id);

				const expectedElement = {
					id: fileFolderElement.id,
					content: { title: fileFolderElement.title },
					timestamps: {
						lastUpdatedAt: fileFolderElement.updatedAt.toISOString(),
						createdAt: fileFolderElement.createdAt.toISOString(),
					},
					type: ContentElementType.FILE_FOLDER,
				};
				const response = result.body as ElementWithParentHierarchyResponse;
				expect(response.element).toEqual(expectedElement);

				const expectedParentHierarchy = [
					{
						id: course.id,
						type: BoardExternalReferenceType.Course,
						name: course.name,
					},
					{
						id: columnBoardNode.id,
						type: ElementReferenceType.BOARD,
						name: columnBoardNode.title,
					},
				];
				expect(response.parentHierarchy).toEqual(expectedParentHierarchy);
			});
		});

		describe('when root parent is room', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.buildWithId({ schoolId: school.id });

				const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomEditorRole, user: teacherUser }],
					organization: school,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: teacherUser.school.id,
				});

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const fileFolderElement = fileFolderElementEntityFactory.withParent(columnBoardNode).build();

				await em.persistAndFlush([
					columnBoardNode,
					fileFolderElement,
					room,
					roomEditorRole,
					school,
					teacherUser,
					teacherAccount,
					userGroup,
					roomMembership,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					fileFolderElement,
					columnBoardNode,
					room,
				};
			};

			it('should return status 200', async () => {
				const { loggedInClient, fileFolderElement } = await setup();

				const response = await loggedInClient.get(fileFolderElement.id);

				expect(response.statusCode).toEqual(200);
			});

			it('should return the correct response', async () => {
				const { loggedInClient, fileFolderElement, room, columnBoardNode } = await setup();

				const result = await loggedInClient.get(fileFolderElement.id);

				const expectedElement = {
					id: fileFolderElement.id,
					content: { title: fileFolderElement.title },
					timestamps: {
						lastUpdatedAt: fileFolderElement.updatedAt.toISOString(),
						createdAt: fileFolderElement.createdAt.toISOString(),
					},
					type: ContentElementType.FILE_FOLDER,
				};
				const response = result.body as ElementWithParentHierarchyResponse;
				expect(response.element).toEqual(expectedElement);

				const expectedParentHierarchy = [
					{
						id: room.id,
						type: BoardExternalReferenceType.Room,
						name: room.name,
					},
					{
						id: columnBoardNode.id,
						type: ElementReferenceType.BOARD,
						name: columnBoardNode.title,
					},
				];
				expect(response.parentHierarchy).toEqual(expectedParentHierarchy);
			});
		});

		describe('when root parent is user', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: teacherUser.id, type: BoardExternalReferenceType.User },
				});
				const fileFolderElement = fileFolderElementEntityFactory.withParent(columnBoardNode).build();

				await em.persistAndFlush([columnBoardNode, fileFolderElement, teacherUser, teacherAccount]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					fileFolderElement,
					columnBoardNode,
					teacherUser,
				};
			};

			it('should return status 200', async () => {
				const { loggedInClient, fileFolderElement } = await setup();

				const response = await loggedInClient.get(fileFolderElement.id);

				expect(response.statusCode).toEqual(200);
			});

			it('should return the correct response', async () => {
				const { loggedInClient, fileFolderElement, columnBoardNode, teacherUser } = await setup();

				const result = await loggedInClient.get(fileFolderElement.id);

				const expectedElement = {
					id: fileFolderElement.id,
					content: { title: fileFolderElement.title },
					timestamps: {
						lastUpdatedAt: fileFolderElement.updatedAt.toISOString(),
						createdAt: fileFolderElement.createdAt.toISOString(),
					},
					type: ContentElementType.FILE_FOLDER,
				};
				const response = result.body as ElementWithParentHierarchyResponse;
				expect(response.element).toEqual(expectedElement);

				const expectedParentHierarchy = [
					{
						id: teacherUser.id,
						type: BoardExternalReferenceType.User,
						name: `${teacherUser.firstName} ${teacherUser.lastName}`,
					},
					{
						id: columnBoardNode.id,
						type: ElementReferenceType.BOARD,
						name: columnBoardNode.title,
					},
				];
				expect(response.parentHierarchy).toEqual(expectedParentHierarchy);
			});
		});
	});

	describe('when user is not authenticated', () => {
		const setup = () => {
			const fileFolderElementId = new ObjectId().toHexString();

			return { fileFolderElementId };
		};

		it('should return status 401', async () => {
			const { fileFolderElementId } = setup();

			const response = await testApiClient.get(fileFolderElementId);

			expect(response.statusCode).toEqual(401);
		});
	});

	describe('when user is not authorized', () => {
		describe('when parent is a course', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ school: teacherUser.school, teachers: [teacherUser] });
				await em.persistAndFlush([teacherUser, teacherAccount, course]);
				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const fileFolderElement = fileFolderElementEntityFactory.withParent(columnBoardNode).build();

				const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
					UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([columnBoardNode, fileFolderElement, otherTeacherAccount, otherTeacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(otherTeacherAccount);

				return {
					loggedInClient,
					fileFolderElement,
					columnBoardNode,
					course,
				};
			};
			it('should return status 403', async () => {
				const { loggedInClient, fileFolderElement } = await setup();

				const response = await loggedInClient.get(fileFolderElement.id);

				expect(response.statusCode).toEqual(403);
			});
		});

		describe('when parent is a room', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.buildWithId({ schoolId: school.id });

				const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomEditorRole, user: teacherUser }],
					organization: school,
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: userGroup.id,
					schoolId: teacherUser.school.id,
				});

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const fileFolderElement = fileFolderElementEntityFactory.withParent(columnBoardNode).build();

				const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
					UserAndAccountTestFactory.buildTeacher({ school });

				await em.persistAndFlush([
					columnBoardNode,
					fileFolderElement,
					room,
					roomEditorRole,
					school,
					teacherUser,
					teacherAccount,
					otherTeacherAccount,
					otherTeacherUser,
					userGroup,
					roomMembership,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(otherTeacherAccount);

				return {
					loggedInClient,
					fileFolderElement,
					columnBoardNode,
					room,
				};
			};

			it('should return status 403', async () => {
				const { loggedInClient, fileFolderElement } = await setup();

				const response = await loggedInClient.get(fileFolderElement.id);

				expect(response.statusCode).toEqual(403);
			});
		});
	});
});
