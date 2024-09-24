import { Room, RoomProps } from '../domain/do/room.do';
import { RoomColor } from '../domain/type';
import { roomEntityFactory, roomFactory } from '../testing';
import { RoomEntity } from './entity';
import { RoomDomainMapper } from './room-domain.mapper';

describe('RoomDomainMapper', () => {
	describe('mapEntityToDo', () => {
		it('should correctly map RoomEntity to Room domain object', () => {
			const roomEntity = {
				id: '1',
				name: 'Test Room',
				color: RoomColor.RED,
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-12-31'),
			} as RoomEntity;

			const result = RoomDomainMapper.mapEntityToDo(roomEntity);

			expect(result).toBeInstanceOf(Room);
			expect(result.getProps()).toEqual({
				id: '1',
				name: 'Test Room',
				color: RoomColor.RED,
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-12-31'),
			});
		});

		it('should return existing domainObject if present, regardless of entity properties', () => {
			const existingRoom = new Room({
				id: '1',
				name: 'Existing Room',
				color: RoomColor.GREEN,
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-12-31'),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const roomEntity = {
				id: '2',
				name: 'Test Room',
				color: RoomColor.RED,
				startDate: new Date('2023-02-01'),
				endDate: new Date('2023-11-30'),
				domainObject: existingRoom,
			} as RoomEntity;

			const result = RoomDomainMapper.mapEntityToDo(roomEntity);

			expect(result).toBe(existingRoom);
			expect(result).toBeInstanceOf(Room);
			expect(result.getProps()).toEqual({
				id: '1',
				name: 'Existing Room',
				color: RoomColor.GREEN,
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-12-31'),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});
			expect(result.getProps().id).toBe('1');
			expect(result.getProps().id).not.toBe(roomEntity.id);
		});

		it('should wrap the actual entity reference in the domain object', () => {
			const roomEntity = {
				id: '1',
				name: 'Test Room',
				color: RoomColor.RED,
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-12-31'),
			} as RoomEntity;

			const result = RoomDomainMapper.mapEntityToDo(roomEntity);
			// @ts-expect-error check necessary
			const { props } = result;

			expect(props === roomEntity).toBe(true);
		});
	});

	describe('mapDoToEntity', () => {
		describe('when domain object props are instanceof RoomEntity', () => {
			it('should return the entity', () => {
				const roomEntity = roomEntityFactory.build();
				const room = new Room(roomEntity);

				const result = RoomDomainMapper.mapDoToEntity(room);

				expect(result).toBe(roomEntity);
			});
		});

		describe('when domain object props are not instanceof RoomEntity', () => {
			it('should convert them to an entity and return it', () => {
				const roomEntity: RoomProps = {
					id: '66d581c3ef74c548a4efea1d',
					name: 'Test Room #1',
					color: RoomColor.RED,
					startDate: new Date('2023-01-01'),
					endDate: new Date('2023-12-31'),
					createdAt: new Date('2024-10-1'),
					updatedAt: new Date('2024-10-1'),
				};
				const room = new Room(roomEntity);

				const result = RoomDomainMapper.mapDoToEntity(room);

				expect(result).toBeInstanceOf(RoomEntity);
				expect(result).toMatchObject(roomEntity);
			});
		});
	});
});
