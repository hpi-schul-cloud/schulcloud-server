import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { roleFactory } from '@testing/factory/role.factory';
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
			const room = roomEntityFactory.buildWithId();
			const role = roleFactory.buildWithId({
				name: RoleName.ROOMEDITOR,
				permissions: [Permission.ROOM_EDIT],
			});
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role, user: teacherUser }],
			});
			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUser.school.id,
			});
			const columnBoardNode = columnBoardEntityFactory.build({
				...columnBoardProps,
				context: { id: room.id, type: BoardExternalReferenceType.Room },
			});
			await em.persistAndFlush([room, roomMembership, teacherAccount, teacherUser, userGroup, role, columnBoardNode]);
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
