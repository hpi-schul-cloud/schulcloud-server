import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { RoleRepo } from '@shared/repo';
import { cleanupCollections, groupEntityFactory, groupFactory, roleFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { Group, GroupService, GroupUser } from '@src/modules/group';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberService } from './room-member.service';

describe('RoomMemberService', () => {
	let module: TestingModule;
	let service: RoomMemberService;
	let roomMemberRepo: DeepMocked<RoomMemberRepo>;
	let groupService: DeepMocked<GroupService>;
	let roleRepo: DeepMocked<RoleRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				RoomMemberService,
				{
					provide: RoomMemberRepo,
					useValue: createMock<RoomMemberRepo>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get<RoomMemberService>(RoomMemberService);
		roomMemberRepo = module.get(RoomMemberRepo);
		groupService = module.get(GroupService);
		roleRepo = module.get(RoleRepo);
		authorizationService = module.get(AuthorizationService);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('addMemberToRoom', () => {
		const setup = () => {
			const user: User = userFactory.buildWithId();
			const groupUser1 = new GroupUser({
				userId: user.id,
				roleId: new ObjectId().toHexString(),
			});
			const groupUser2 = new GroupUser({
				userId: new ObjectId().toHexString(),
				roleId: new ObjectId().toHexString(),
			});
			const group: Group = groupFactory.build({
				users: [groupUser1, groupUser2],
			});

			return {
				user,
				groupUser1,
				groupUser2,
				group,
			};
		};

		it('should return not call authorization service if room member not exists', async () => {
			const { user } = setup();
			const roomId = 'room123';
			roomMemberRepo.findByRoomId.mockResolvedValue(null);
			await service.hasAuthorization(roomId, user, Action.write);
			expect(authorizationService.hasPermission).not.toHaveBeenCalled();
		});

		it('should return call authorization service if room member exists', async () => {
			const { user } = setup();
			const roomId = 'room123';
			const roomMember = roomMemberEntityFactory.build({ roomId });
			roomMemberRepo.findById.mockResolvedValue(roomMember);
			await service.hasAuthorization(roomId, user, Action.write);
			expect(authorizationService.hasPermission).toHaveBeenCalled();
		});

		it('should create new room member when not exists', async () => {
			const { user } = setup();
			const roomId = 'room123';
			const roleName = RoleName.ROOM_EDITOR;
			roomMemberRepo.findById.mockResolvedValue(null);
			await service.addMemberToRoom(roomId, user, roleName);
			expect(groupService.save).toHaveBeenCalled();
			expect(roomMemberRepo.save).toHaveBeenCalled();
		});

		it('should add user to existing room member', async () => {
			const { user } = setup();
			const roomId = 'room123';
			const roleName = RoleName.ROOM_EDITOR;
			const roomMember = roomMemberEntityFactory.build({ roomId });
			const role = roleFactory.buildWithId({ name: roleName });
			roomMemberRepo.findById.mockResolvedValue(roomMember);
			roleRepo.findByName.mockResolvedValue(role);
			await service.addMemberToRoom(roomId, user, roleName);
			expect(roomMemberRepo.save).toHaveBeenCalled();
		});
	});

	describe('batchHasAuthorization', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId();
			const userGroup = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const room1Id = new ObjectId();
			const room2Id = new ObjectId();
			const room3Id = new ObjectId();
			const roomMembers = [
				roomMemberEntityFactory.build({ roomId: room1Id, userGroup }),
				roomMemberEntityFactory.build({ roomId: room2Id, userGroup }),
				roomMemberEntityFactory.build({ roomId: room3Id, userGroup }),
			];
			return { user, role, roomMembers, room1Id, room2Id, room3Id };
		};

		it('should return authorization status for multiple rooms', async () => {
			const { user, roomMembers, room1Id, room2Id, room3Id } = setup();

			roomMemberRepo.findByRoomIds.mockResolvedValue(roomMembers);
			authorizationService.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true);

			const result = await service.batchHasAuthorization(
				[room1Id.toHexString(), room2Id.toHexString(), room3Id.toHexString()],
				user,
				Action.read
			);

			expect(result).toEqual([
				{ roomId: room1Id.toHexString(), hasAuthorization: true },
				{ roomId: room2Id.toHexString(), hasAuthorization: false },
				{ roomId: room3Id.toHexString(), hasAuthorization: true },
			]);

			expect(roomMemberRepo.findByRoomIds).toHaveBeenCalledWith([
				room1Id.toHexString(),
				room2Id.toHexString(),
				room3Id.toHexString(),
			]);
			expect(authorizationService.hasPermission).toHaveBeenCalledTimes(3);
		});

		it('should return empty array if no room members found', async () => {
			const { user, room1Id, room2Id, room3Id } = setup();

			roomMemberRepo.findByRoomIds.mockResolvedValue([]);

			const result = await service.batchHasAuthorization(
				[room1Id.toHexString(), room2Id.toHexString(), room3Id.toHexString()],
				user,
				Action.read
			);

			expect(result).toEqual([]);

			expect(roomMemberRepo.findByRoomIds).toHaveBeenCalledWith([
				room1Id.toHexString(),
				room2Id.toHexString(),
				room3Id.toHexString(),
			]);
			expect(authorizationService.hasPermission).not.toHaveBeenCalled();
		});
	});
});
