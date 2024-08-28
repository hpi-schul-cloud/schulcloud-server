import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Page } from '@shared/domain/domainobject';
import { RoomService } from './room.service';
import { RoomRepo } from '../../repo';
import { Room } from '../do';
import { roomFactory } from '../../testing';

describe('RoomService', () => {
	let module: TestingModule;
	let service: RoomService;
	let roomRepo: DeepMocked<RoomRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomService,
				{
					provide: RoomRepo,
					useValue: createMock<RoomRepo>(),
				},
			],
		}).compile();

		service = module.get<RoomService>(RoomService);
		roomRepo = module.get(RoomRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getRooms', () => {
		const setup = () => {
			const rooms: Room[] = roomFactory.buildList(2);
			const paginatedRooms: Page<Room> = new Page<Room>(rooms, rooms.length);
			roomRepo.getRooms.mockResolvedValue(paginatedRooms);

			return {
				paginatedRooms,
			};
		};
		it('should call repo to get rooms', async () => {
			setup();

			await service.getRooms({});

			expect(roomRepo.getRooms).toHaveBeenCalledWith({});
		});
		it('should return rooms', async () => {
			const { paginatedRooms } = setup();

			const result = await service.getRooms({});

			expect(result).toEqual(paginatedRooms);
		});
	});
});
