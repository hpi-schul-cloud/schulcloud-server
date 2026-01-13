import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType, ColumnBoardProps } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe(`board copy with room relation (api)`, () => {
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

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('with valid user', () => {
		const setup = async (columnBoardProps: Partial<ColumnBoardProps> = {}) => {
			const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role: roomEditorRole, user: teacherUser }],
			});
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUser.school.id,
			});
			const columnBoardNode = columnBoardEntityFactory.build({
				...columnBoardProps,
				context: { id: room.id, type: BoardExternalReferenceType.Room },
			});
			await em
				.persist([room, roomMembership, teacherAccount, teacherUser, userGroup, roomEditorRole, columnBoardNode])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 201', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(201);
		});
	});
});
