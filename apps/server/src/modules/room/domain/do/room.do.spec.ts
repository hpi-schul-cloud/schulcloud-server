import { ObjectId } from '@mikro-orm/mongodb';
import { type EntityId } from '@shared/domain/types';
import { roomFactory } from '../../testing';
import { RoomColor, RoomFeatures } from '../type';
import { Room, type RoomProps } from './room.do';

describe('Room', () => {
	let room: Room;
	const roomId: EntityId = 'roomId';
	const roomProps: RoomProps = {
		id: roomId,
		name: 'Conference Room',
		color: RoomColor.BLUE,
		startDate: new Date('2024-01-01'),
		endDate: new Date('2024-12-31'),
		schoolId: new ObjectId().toHexString(),
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		features: [],
	};

	beforeEach(() => {
		room = new Room(roomProps);
	});

	it('should props without domainObject', () => {
		const mockDomainObject = roomFactory.build();
		// this tests the hotfix for the mikro-orm issue

		room['domainObject'] = mockDomainObject;

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
		expect(room.color).toBe(RoomColor.BLUE);
		room.color = RoomColor.RED;
		expect(room.color).toBe(RoomColor.RED);
	});

	it('should get and set startDate', () => {
		expect(room.startDate).toEqual(new Date('2024-01-01'));
		const newStartDate = new Date('2024-02-01');
		room.startDate = newStartDate;
		expect(room.startDate).toEqual(newStartDate);
	});

	it('should get and set endDate', () => {
		expect(room.endDate).toEqual(new Date('2024-12-31'));
		const newEndDate = new Date('2024-11-30');
		room.endDate = newEndDate;
		expect(room.endDate).toEqual(newEndDate);
	});

	it('should get createdAt', () => {
		const expectedCreatedAt = new Date('2024-01-01');
		expect(room.createdAt).toEqual(expectedCreatedAt);
	});

	it('should get updatedAt', () => {
		const expectedUpdatedAt = new Date('2024-01-01');
		expect(room.updatedAt).toEqual(expectedUpdatedAt);
	});

	it('should get and set features', () => {
		expect(room.features).toEqual([]);
		room.features = [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE];
		expect(room.features).toEqual([RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE]);
	});

	it('should get room name', () => {
		const expectedRoomName = roomProps.name;
		expect(room.getRoomName()).toBe(expectedRoomName);
	});

	describe('isArchived', () => {
		it('should return false when archivedAt is not set', () => {
			expect(room.isArchived).toBe(false);
		});

		it('should return true when archivedAt is set', () => {
			const archivedRoom = new Room({ ...roomProps, archivedAt: new Date() });

			expect(archivedRoom.isArchived).toBe(true);
		});
	});

	describe('archive', () => {
		it('should set archivedAt', () => {
			room.archive();

			expect(room.isArchived).toBe(true);
			expect(room.archivedAt).toBeInstanceOf(Date);
		});

		it('should not change archivedAt when already archived', () => {
			room.archive();
			const firstArchivedAt = room.archivedAt;

			room.archive();

			expect(room.archivedAt).toBe(firstArchivedAt);
		});
	});

	describe('unarchive', () => {
		it('should clear archivedAt', () => {
			room.archive();

			room.unarchive();

			expect(room.isArchived).toBe(false);
			expect(room.archivedAt).toBeUndefined();
		});

		it('should be a no-op when room is not archived', () => {
			room.unarchive();

			expect(room.isArchived).toBe(false);
		});
	});
});
