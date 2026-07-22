import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { BoardExternalReferenceType, type ColumnBoardProps } from '../../domain';
import { columnBoardEntityFactory } from '../../testing';

const baseRouteName = '/boards';

describe(`board copy with room relation (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('with valid user', () => {
		const setup = async (columnBoardProps: Partial<ColumnBoardProps> = {}) => {
			const { roomEditorRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
			const school = schoolEntityFactory.buildWithId();
			const { teacherUser: ownerUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomEditorRole, user: teacherUser },
					{ role: roomOwnerRole, user: ownerUser },
				],
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

			const loggedInClient = await new TestApiClientBuilder(app, baseRouteName).build(teacherAccount);

			return { loggedInClient, columnBoardNode };
		};

		it('should return status 201', async () => {
			const { loggedInClient, columnBoardNode } = await setup();

			const response = await loggedInClient.post(`${columnBoardNode.id}/copy`);

			expect(response.status).toEqual(201);
		});
	});
});
