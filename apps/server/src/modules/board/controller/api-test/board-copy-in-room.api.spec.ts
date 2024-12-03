import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	cleanupCollections,
	groupEntityFactory,
	roleFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { GroupEntityTypes } from '@src/modules/group/entity';
import { roomMembershipEntityFactory } from '@src/modules/room-membership/testing';
import { roomEntityFactory } from '@src/modules/room/testing';
import { ServerTestModule } from '@src/modules/server';
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
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role, user: teacherUser }],
			});
			const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });
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
