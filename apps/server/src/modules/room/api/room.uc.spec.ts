import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ColumnBoardService } from '@modules/board';
import { RoomMembershipService } from '@modules/room-membership';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { Room, RoomService } from '../domain';
import { RoomColor } from '../domain/type';
import { roomFactory } from '../testing';
import { RoomUc } from './room.uc';
import { RoomPermissionService } from './service';

describe('RoomUc', () => {
	let module: TestingModule;
	let uc: RoomUc;
	let configService: DeepMocked<ConfigService>;
	let roomService: DeepMocked<RoomService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomUc,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: RoomPermissionService,
					useValue: createMock<RoomPermissionService>(),
				},
			],
		}).compile();

		uc = module.get<RoomUc>(RoomUc);
		configService = module.get(ConfigService);
		roomService = module.get(RoomService);
		authorizationService = module.get(AuthorizationService);
		roomMembershipService = module.get(RoomMembershipService);
		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getRooms', () => {
		const setup = () => {
			configService.get.mockReturnValue(true);
			const rooms: Room[] = roomFactory.buildList(2);
			const paginatedRooms: Page<Room> = new Page<Room>(rooms, rooms.length);
			roomService.getRoomsByIds.mockResolvedValue(paginatedRooms);
			const findOptions: IFindOptions<Room> = {};

			return {
				findOptions,
				paginatedRooms,
			};
		};

		it('should call roomService.getRooms with findOptions', async () => {
			const { findOptions } = setup();

			jest.spyOn(uc as any, 'getAuthorizedRoomIds').mockResolvedValue([]);
			await uc.getRooms('userId', findOptions);

			expect(roomService.getRoomsByIds).toHaveBeenCalledWith([], findOptions);
		});

		it('should return rooms when feature is enabled', async () => {
			const { paginatedRooms } = setup();
			jest.spyOn(uc as any, 'getAuthorizedRoomIds').mockResolvedValue(paginatedRooms.data.map((room) => room.id));

			const result = await uc.getRooms('userId', {});
			expect(result).toEqual(paginatedRooms);
		});
	});

	describe('createRoom', () => {
		const setup = () => {
			const user = userFactory.build();
			configService.get.mockReturnValue(true);
			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			authorizationService.checkOneOfPermissions.mockReturnValue(undefined);
			const room = roomFactory.build();
			roomService.createRoom.mockResolvedValue(room);
			roomMembershipService.createNewRoomMembership.mockRejectedValue(new Error('test'));
			return { user, room };
		};

		it('should cleanup room if room members throws error', async () => {
			const { user, room } = setup();

			await expect(uc.createRoom(user.id, { color: RoomColor.BLUE, name: 'test', features: [] })).rejects.toThrow();

			expect(roomService.deleteRoom).toHaveBeenCalledWith(room);
		});
	});
});
