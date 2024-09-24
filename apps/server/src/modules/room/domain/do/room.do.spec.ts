import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { roomFactory } from '../../testing';
import { RoomColor } from '../type';
import { Room, RoomProps } from './room.do';

describe('Room', () => {
	let room: Room;
	const roomId: EntityId = 'roomId';
	const roomProps: RoomProps = {
		id: roomId,
		name: 'Conference Room',
		color: RoomColor.BLUE,
		startDate: new Date('2024-01-01'),
		endDate: new Date('2024-12-31'),
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
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

	describe('time frame validation', () => {
		const setup = () => {
			const props: RoomProps = {
				id: roomId,
				name: 'Conference Room',
				color: RoomColor.BLUE,
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			};

			return { props };
		};

		describe('when costructor is called with invalid time frame', () => {
			it('should throw validation error', () => {
				const buildInvalid = () => {
					const { props } = setup();
					props.startDate = new Date('2024-12-31');
					props.endDate = new Date('2024-01-01');
					// eslint-disable-next-line no-new
					new Room(props);
				};
				expect(buildInvalid).toThrowError(ValidationError);
			});
		});

		describe('when setting start date after end date', () => {
			it('should throw validation error', () => {
				const setInvalidStartDate = () => {
					const { props } = setup();
					const inValidRoom = new Room(props);
					inValidRoom.startDate = new Date('2025-01-01');
				};
				expect(setInvalidStartDate).toThrowError(ValidationError);
			});
		});

		describe('when setting end date before start date', () => {
			it('should throw validation error', () => {
				const setInvalidEndDate = () => {
					const { props } = setup();
					const inValidRoom = new Room(props);
					inValidRoom.endDate = new Date('2023-12-31');
				};
				expect(setInvalidEndDate).toThrowError(ValidationError);
			});
		});
	});
});
