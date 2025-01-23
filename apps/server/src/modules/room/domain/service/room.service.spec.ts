import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { roomFactory } from '../../testing';
import { Room, RoomCreateProps, RoomUpdateProps } from '../do';
import { RoomColor } from '../type';
import { RoomService } from './room.service';

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
				schoolId: new ObjectId().toHexString(),
			};
			return { props };
		};

		it('should call repo to save room', async () => {
			const { props } = setup();

			await service.createRoom(props);

			expect(roomRepo.save).toHaveBeenCalledWith(expect.objectContaining(props));
		});

		it('should throw validation error if start date is after end date', async () => {
			const { props } = setup();
			props.startDate = new Date('2024-12-31');
			props.endDate = new Date('2024-01-01');

			await expect(service.createRoom(props)).rejects.toThrowError(ValidationError);
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

		it('should throw validation error if start date is after end date', async () => {
			const { props, room } = setup();
			props.startDate = new Date('2024-12-31');
			props.endDate = new Date('2024-01-01');

			await expect(service.updateRoom(room, props)).rejects.toThrowError(ValidationError);
		});
	});

	describe('deleteRoom', () => {
		it('should call repo to delete room', async () => {
			const room = roomFactory.build();

			await service.deleteRoom(room);

			expect(roomRepo.delete).toHaveBeenCalledWith(room);
		});
	});

	describe('getRoomsByIds', () => {
		it('should return rooms for given ids', async () => {
			const roomIds: EntityId[] = ['1', '2', '3'];
			const mockRooms: Room[] = [
				{ id: '1', name: 'Room 1' },
				{ id: '2', name: 'Room 2' },
				{ id: '3', name: 'Room 3' },
			] as Room[];
			const mockPage: Page<Room> = {
				data: mockRooms,
				total: 3,
			};

			jest.spyOn(roomRepo, 'findRoomsByIds').mockResolvedValue(mockPage);

			const result = await service.getRoomsByIds(roomIds, {});

			expect(roomRepo.findRoomsByIds).toHaveBeenCalledWith(roomIds, {});
			expect(result).toEqual(mockPage);
			expect(result.data.length).toBe(3);
			expect(result.data[0].id).toBe('1');
			expect(result.data[1].id).toBe('2');
			expect(result.data[2].id).toBe('3');
		});
	});
});
