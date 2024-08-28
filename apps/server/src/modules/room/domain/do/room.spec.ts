import { EntityId } from '@shared/domain/types';
import { Room, RoomProps } from './room.do';

describe('Room', () => {
	let room: Room;
	const roomId: EntityId = 'roomId';
	const roomProps: RoomProps = {
		id: roomId,
		name: 'Conference Room',
		color: 'blue',
		startDate: new Date('2024-01-01'),
		untilDate: new Date('2024-12-31'),
	};

	beforeEach(() => {
		room = new Room(roomProps);
	});

	it('should get and set name', () => {
		expect(room.name).toBe('Conference Room');
		room.name = 'Meeting Room';
		expect(room.name).toBe('Meeting Room');
	});

	it('should get and set color', () => {
		expect(room.color).toBe('blue');
		room.color = 'red';
		expect(room.color).toBe('red');
	});

	it('should get and set startDate', () => {
		expect(room.startDate).toEqual(new Date('2024-01-01'));
		const newStartDate = new Date('2024-02-01');
		room.startDate = newStartDate;
		expect(room.startDate).toEqual(newStartDate);
	});

	it('should get and set untilDate', () => {
		expect(room.untilDate).toEqual(new Date('2024-12-31'));
		const newUntilDate = new Date('2024-11-30');
		room.untilDate = newUntilDate;
		expect(room.untilDate).toEqual(newUntilDate);
	});
});
