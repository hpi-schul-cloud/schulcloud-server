import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity';
import { RoomDomainMapper } from './room-domain.mapper';

describe('RoomDomainMapper', () => {
	describe('mapDoToEntityData', () => {
		it('should correctly map Room domain object to RoomEntity data', () => {
			const roomDo = new Room({
				id: '1',
				name: 'Test Room',
				color: '#FF0000',
				startDate: new Date('2023-01-01'),
				untilDate: new Date('2023-12-31'),
			});

			const result = RoomDomainMapper.mapDoToEntityData(roomDo);

			expect(result).toEqual({
				id: '1',
				name: 'Test Room',
				color: '#FF0000',
				startDate: new Date('2023-01-01'),
				untilDate: new Date('2023-12-31'),
			});
		});
	});

	describe('mapEntityToDo', () => {
		it('should correctly map RoomEntity to Room domain object', () => {
			const roomEntity = {
				id: '1',
				name: 'Test Room',
				color: '#FF0000',
				startDate: new Date('2023-01-01'),
				untilDate: new Date('2023-12-31'),
			} as RoomEntity;

			const result = RoomDomainMapper.mapEntityToDo(roomEntity);

			expect(result).toBeInstanceOf(Room);
			expect(result.getProps()).toEqual({
				id: '1',
				name: 'Test Room',
				color: '#FF0000',
				startDate: new Date('2023-01-01'),
				untilDate: new Date('2023-12-31'),
			});
		});
	});
});
