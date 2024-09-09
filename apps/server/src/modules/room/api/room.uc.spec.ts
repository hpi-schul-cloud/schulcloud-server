import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IFindOptions } from '@shared/domain/interface';
import { RoomUc } from './room.uc';
import { RoomService, Room } from '../domain';
import { roomFactory } from '../testing';

describe('RoomUc', () => {
	let module: TestingModule;
	let uc: RoomUc;
	let configService: DeepMocked<ConfigService>;
	let roomService: DeepMocked<RoomService>;

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
			],
		}).compile();

		uc = module.get<RoomUc>(RoomUc);
		configService = module.get(ConfigService);
		roomService = module.get(RoomService);
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
			roomService.getRooms.mockResolvedValue(paginatedRooms);
			const findOptions: IFindOptions<Room> = {};

			return {
				findOptions,
				paginatedRooms,
			};
		};
		it('should throw FeatureDisabledLoggableException when feature is disabled', async () => {
			configService.get.mockReturnValue(false);

			await expect(uc.getRooms('userId', {})).rejects.toThrow(FeatureDisabledLoggableException);
		});

		it('should call roomService.getRooms with findOptions', async () => {
			const { findOptions } = setup();

			await uc.getRooms('userId', findOptions);
			expect(roomService.getRooms).toHaveBeenCalledWith(findOptions);
		});

		it('should return rooms when feature is enabled', async () => {
			const { paginatedRooms } = setup();
			const result = await uc.getRooms('userId', {});

			expect(result).toEqual(paginatedRooms);
		});
	});
});
