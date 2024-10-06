import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { GroupService, GroupTypes } from '@src/modules/group';
import { RoleService } from '@src/modules/role/service/role.service';
import { EntityManager } from '@mikro-orm/mongodb';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupFactory, userFactory } from '@shared/testing';
import { RoomMemberService } from './room-member.service';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { roomMemberEntityFactory } from '../testing';
import { de } from '@faker-js/faker';

describe('RoomMemberService', () => {
	let module: TestingModule;
	let service: RoomMemberService;
	let roomMemberRepo: DeepMocked<RoomMemberRepo>;
	let groupService: DeepMocked<GroupService>;
	let roleService: DeepMocked<RoleService>;
	let em: EntityManager;


	beforeAll(async () => {
		module = await Test.createTestingModule({
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
					provide: RoleService,
					useValue: createMock<RoleService>(),
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
		roleService = module.get(RoleService);
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

	describe('test', () => {
		it('test2', () => {
			const user = userFactory.buildWithId();
			expect(user).toBeDefined();
		});
	});

	// describe('addMemberToRoom', () => {
	// 	const setup = () => {
	// 		const roomId = 'room123';
	// 		console.log('------1');
	// 		const user = userFactory.build();
	// 		console.log('------2'); // TODO: understand why code break when factory is used
	// 		const roleName = RoleName.ROOM_EDITOR;
	// 		const roomMember = roomMemberEntityFactory.build({ roomId });

	// 		roleService.findByName.mockResolvedValue({ name: roleName, permissions: [] });
	// 		const group = groupFactory.buildWithId({ users: [] });
	// 		groupService.save.mockResolvedValue(group);

	// 		return { roomId, user, roleName, roomMember };
	// 	};

	// 	it('should create new room member when not exists', async () => {
	// 		const { roomId, user, roleName } = setup();
	// 		roomMemberRepo.findById.mockResolvedValue(null);

	// 		await service.addMemberToRoom(roomId, user, roleName);

	// 		expect(groupService.save).toHaveBeenCalled();
	// 		expect(roomMemberRepo.save).toHaveBeenCalled();
	// 	});

	// 	// it('should add user to existing room member', async () => {
	// 	// 	const { roomId, user, roleName, roomMember } = setup();
	// 	// 	roomMemberRepo.findById.mockResolvedValue(roomMember);

	// 	// 	await service.addMemberToRoom(roomId, user, roleName);

	// 	// 	expect(roomMemberRepo.save).toHaveBeenCalledWith(
	// 	// 		expect.objectContaining({
	// 	// 			userGroup: expect.objectContaining({
	// 	// 				users: expect.arrayContaining([expect.any(Object)]),
	// 	// 			}),
	// 	// 		})
	// 	// 	);
	// 	// });
	// });
});
