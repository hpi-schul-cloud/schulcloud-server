import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Page } from '@shared/domain/domainobject';
import { RoomService } from './room.service';
import { RoomRepo } from '../../repo';
import { Room, RoomCreateProps, RoomUpdateProps } from '../do';
import { roomFactory } from '../../testing';
import { RoomColor } from '../type';

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
			roomRepo.findRooms.mockResolvedValue(paginatedRooms);

			return {
				paginatedRooms,
			};
		};

		it('should call repo to get rooms', async () => {
			setup();

			await service.getRooms({});

			expect(roomRepo.findRooms).toHaveBeenCalledWith({});
		});

		it('should return rooms', async () => {
			const { paginatedRooms } = setup();

			const result = await service.getRooms({});

			expect(result).toEqual(paginatedRooms);
		});
	});

	describe('createRoom', () => {
		const setup = () => {
			const props: RoomCreateProps = {
				name: 'room #1',
				color: RoomColor.ORANGE,
			};
			return { props };
		};

		it('should call repo to save room', async () => {
			const { props } = setup();

			await service.createRoom(props);

			expect(roomRepo.save).toHaveBeenCalledWith(expect.objectContaining(props));
		});
	});

	describe('getSingleRoom', () => {
		const setup = () => {
			const room = roomFactory.build();
			roomRepo.findById.mockResolvedValue(room);

			return { room };
		};

		it('should call repo to get room', async () => {
			const { room } = setup();

			await service.getSingleRoom(room.id);

			expect(roomRepo.findById).toHaveBeenCalledWith(room.id);
		});

		it('should return room', async () => {
			const { room } = setup();

			const result = await service.getSingleRoom(room.id);

			expect(result).toBe(room);
		});
	});

	describe('updateRoom', () => {
		const setup = () => {
			const room = roomFactory.build({
				name: 'initial name',
				color: RoomColor.ORANGE,
			});

			const props: RoomUpdateProps = {
				name: 'updated name',
				color: RoomColor.BLUE_GREY,
			};

			return { props, room };
		};

		it('should update the room properties', async () => {
			const { props, room } = setup();

			await service.updateRoom(room, props);

			expect(room).toMatchObject(props);
		});

		it('should call repo to save room', async () => {
			const { props, room } = setup();

			await service.updateRoom(room, props);

			expect(roomRepo.save).toHaveBeenCalledWith(room);
		});
	});

	describe('deleteRoom', () => {
		it('should call repo to delete room', async () => {
			const room = roomFactory.build();

			await service.deleteRoom(room);

			expect(roomRepo.delete).toHaveBeenCalledWith(room);
		});
	});
});
