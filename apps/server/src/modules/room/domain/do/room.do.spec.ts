import { EntityId } from '@shared/domain/types';
import { Room, RoomProps } from './room.do';
import { roomFactory } from '../../testing';

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

	it('should props without domainObject', () => {
		const mockDomainObject = roomFactory.build();
		// this tests the hotfix for the mikro-orm issue
		// eslint-disable-next-line @typescript-eslint/dot-notation
		room['domainObject'] = mockDomainObject;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...props } = room.getProps();

		expect(domainObject).toEqual(undefined);
		expect(props).toEqual(roomProps);
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

	it('should get and set createdAt', () => {
		expect(room.createdAt).toBeUndefined();
		const createdAt = new Date('2024-01-01T00:00:00Z');
		room.createdAt = createdAt;
		expect(room.createdAt).toEqual(createdAt);
	});

	it('should get and set updatedAt', () => {
		expect(room.updatedAt).toBeUndefined();
		const updatedAt = new Date('2024-01-01T00:00:00Z');
		room.updatedAt = updatedAt;
		expect(room.updatedAt).toEqual(updatedAt);
	});
});
