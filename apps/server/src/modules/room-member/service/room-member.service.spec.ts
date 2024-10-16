import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { RoleRepo } from '@shared/repo';
import { cleanupCollections, groupFactory, roleFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { Group, GroupService, GroupTypes, GroupUser } from '@src/modules/group';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { RoomMemberService } from './room-member.service';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberDomainMapper } from '../repo/room-member-domain.mapper';

describe('RoomMemberService', () => {
	let module: TestingModule;
	let service: RoomMemberService;
	let roomMemberRepo: DeepMocked<RoomMemberRepo>;
	let groupService: DeepMocked<GroupService>;
	let roleRepo: DeepMocked<RoleRepo>;
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
			],
		}).compile();

		service = module.get<RoomMemberService>(RoomMemberService);
		roomMemberRepo = module.get(RoomMemberRepo);
		groupService = module.get(GroupService);
		roleRepo = module.get(RoleRepo);
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
				type: GroupTypes.ROOM,
				users: [groupUser1, groupUser2],
			});
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });

			return {
				user,
				groupUser1,
				groupUser2,
				group,
				role,
			};
		};

		it('should create new room member when not exists', async () => {
			const { user, role } = setup();
			const roomId = new ObjectId().toHexString();
			roomMemberRepo.findById.mockResolvedValue(null);
			roleRepo.findByName.mockResolvedValue(role);
			await service.addMemberToRoom(roomId, user, RoleName.ROOM_EDITOR);
			expect(groupService.save).toHaveBeenCalled();
			expect(roomMemberRepo.save).toHaveBeenCalled();
		});

		it('should add user to existing room member', async () => {
			const { user, role } = setup();
			const roomId = new ObjectId().toHexString();
			const roleName = RoleName.ROOM_EDITOR;
			const roomMemberEntity = roomMemberEntityFactory.build({ roomId });
			const roomMember = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, [{ user, role }]);
			roomMemberRepo.findById.mockResolvedValue(roomMember);
			roleRepo.findByName.mockResolvedValue(role);
			await service.addMemberToRoom(roomId, user, roleName);
			expect(groupService.save).toHaveBeenCalled();
			expect(roomMemberRepo.save).not.toHaveBeenCalled();
		});
	});
});
