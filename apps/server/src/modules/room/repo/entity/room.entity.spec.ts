import { ObjectId } from '@mikro-orm/mongodb';
import { RoomEntity, RoomEntityProps } from './room.entity';

describe('RoomEntity', () => {
	const setup = () => {
		const roomProps: RoomEntityProps = {
			name: 'Test Room',
			color: '#FF0000',
			startDate: new Date('2023-01-01'),
			untilDate: new Date('2023-12-31'),
		};

		return { roomProps };
	};

	describe('constructor', () => {
		it('should create a RoomEntity instance with provided properties', () => {
			const { roomProps } = setup();
			const room = new RoomEntity(roomProps);

			expect(room).toBeInstanceOf(RoomEntity);
			expect(room.name).toBe(roomProps.name);
			expect(room.color).toBe(roomProps.color);
			expect(room.startDate).toEqual(roomProps.startDate);
			expect(room.untilDate).toEqual(roomProps.untilDate);
		});

		it('should create a RoomEntity instance with an id if provided', () => {
			const { roomProps } = setup();
			const id = new ObjectId().toHexString();
			const roomWithId = new RoomEntity({ ...roomProps, id });

			expect(roomWithId.id).toBe(id);
		});

		it('should create a RoomEntity instance without optional properties', () => {
			const minimalProps: RoomEntityProps = {
				name: 'Minimal Room',
				color: '#00FF00',
			};
			const minimalRoom = new RoomEntity(minimalProps);

			expect(minimalRoom.name).toBe(minimalProps.name);
			expect(minimalRoom.color).toBe(minimalProps.color);
			expect(minimalRoom.startDate).toBeUndefined();
			expect(minimalRoom.untilDate).toBeUndefined();
		});
	});

	describe('domainObject', () => {
		it('should have a domainObject property that is initially undefined', () => {
			const { roomProps } = setup();
			const room = new RoomEntity(roomProps);

			expect(room.domainObject).toBeUndefined();
		});
	});
});
