import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board';
import { columnBoardEntityFactory } from '@modules/board/testing';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { roleFactory } from '@testing/factory/role.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenService } from '../../service';

describe('Sharing Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let shareTokenService: ShareTokenService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'sharetoken');
		shareTokenService = module.get(ShareTokenService);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		Configuration.set('FEATURE_COLUMN_BOARD_SHARE', true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /sharetoken/:token/import', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId({ schoolId: school.id });
			const role = roleFactory.buildWithId({
				name: RoleName.ROOMEDITOR,
				permissions: [Permission.ROOM_EDIT],
			});
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role, user: teacherUser }],
			});
			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: school.id,
			});
			const board = columnBoardEntityFactory.build({
				context: { id: room.id, type: BoardExternalReferenceType.Room },
			});
			await em.persistAndFlush([room, roomMembership, teacherAccount, teacherUser, userGroup, role, board]);
			em.clear();

			const shareToken = await shareTokenService.createToken({
				parentId: board.id,
				parentType: ShareTokenParentType.ColumnBoard,
			});

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, token: shareToken.token, room };
		};

		describe('when the feature is disabled', () => {
			beforeEach(() => {
				Configuration.set('FEATURE_COLUMN_BOARD_SHARE', false);
			});

			it('should return a 403 error', async () => {
				const { loggedInClient, token } = await setup();
				const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			describe('when the destination is omitted', () => {
				it('should return a 401 status', async () => {
					const { loggedInClient, token } = await setup();
					const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName' });
					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});

			describe('when the destination is valid', () => {
				it('should return a 201 status', async () => {
					const { loggedInClient, token, room } = await setup();
					const response = await loggedInClient.post(`${token}/import`, { newName: 'NewName', destinationId: room.id });
					expect(response.status).toBe(HttpStatus.CREATED);
				});
			});
		});
	});
});
