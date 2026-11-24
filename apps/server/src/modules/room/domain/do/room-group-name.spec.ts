import { RoomGroupNameInvalidError } from '../error';
import { RoomGroupNameInvalidReason } from '../type';
import { isSameRoomGroupName, normalizeRoomGroupName, ROOM_GROUP_NAME_MAX_LENGTH } from './room-group-name';

const catchError = (act: () => unknown): unknown => {
	try {
		act();
	} catch (error) {
		return error;
	}

	return undefined;
};

describe('room-group-name', () => {
	describe('normalizeRoomGroupName', () => {
		describe('when the name is valid (shared fixtures)', () => {
			it.each([
				['Informatik', 'Informatik'],
				['  Deutsch  ', 'Deutsch'],
				['Mathe  6a', 'Mathe  6a'],
				['Cafe\u0301', 'Café'],
				['Café', 'Café'],
				['a'.repeat(100), 'a'.repeat(100)],
				['😀'.repeat(100), '😀'.repeat(100)],
			])('should normalize %j to %j', (rawName, expected) => {
				const result = normalizeRoomGroupName(rawName);

				expect(result).toBe(expected);
			});

			it('should count code points, so that "Café" has length 4', () => {
				const result = normalizeRoomGroupName('Cafe\u0301');

				expect([...result].length).toBe(4);
			});

			it('should accept 100 code points that need 200 UTF-16 units', () => {
				const name = '😀'.repeat(ROOM_GROUP_NAME_MAX_LENGTH);

				const result = normalizeRoomGroupName(name);

				expect(result.length).toBe(2 * ROOM_GROUP_NAME_MAX_LENGTH);
			});
		});

		describe('when the name is invalid (shared fixtures)', () => {
			it.each([
				['', RoomGroupNameInvalidReason.REQUIRED],
				['   \t ', RoomGroupNameInvalidReason.REQUIRED],
				['a'.repeat(101), RoomGroupNameInvalidReason.TOO_LONG],
				['😀'.repeat(101), RoomGroupNameInvalidReason.TOO_LONG],
				['Mathe\n6a', RoomGroupNameInvalidReason.INVALID_CHARACTERS],
				['Mathe\u0000', RoomGroupNameInvalidReason.INVALID_CHARACTERS],
				['Mathe\u20286a', RoomGroupNameInvalidReason.INVALID_CHARACTERS],
				['Mathe\u2029 6a', RoomGroupNameInvalidReason.INVALID_CHARACTERS],
			])('should reject %j with reason %s', (rawName, reason) => {
				const error = catchError(() => normalizeRoomGroupName(rawName));

				expect(error).toBeInstanceOf(RoomGroupNameInvalidError);
				expect(error).toMatchObject({
					code: 400,
					type: 'ROOM_GROUP_NAME_INVALID',
					details: { field: 'name', reason },
				});
			});
		});
	});

	describe('isSameRoomGroupName', () => {
		describe('when the names only differ in case', () => {
			it('should return true', () => {
				const result = isSameRoomGroupName('Informatik', 'INFORMATIK');

				expect(result).toBe(true);
			});
		});

		describe('when the names differ', () => {
			it('should return false', () => {
				const result = isSameRoomGroupName('Informatik', 'Deutsch');

				expect(result).toBe(false);
			});
		});
	});
});
