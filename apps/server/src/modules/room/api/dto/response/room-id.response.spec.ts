import { RoomIdResponse } from './room-id.response';

describe('RoomIdResponse', () => {
	it('should create an instance with the correct id', () => {
		const room = new RoomIdResponse({ id: '12345' });
		expect(room.id).toBe('12345');
	});

	it('should handle empty input gracefully', () => {
		const room = new RoomIdResponse({ id: '' });
		expect(room.id).toBe('');
	});

	it('should throw an error if input is null or undefined', () => {
		expect(() => new RoomIdResponse(null as unknown as RoomIdResponse)).toThrow();
		expect(() => new RoomIdResponse(undefined as unknown as RoomIdResponse)).toThrow();
	});
});
