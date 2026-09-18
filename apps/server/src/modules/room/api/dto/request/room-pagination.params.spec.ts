import { validate } from 'class-validator';
import { RoomPaginationParams } from './room-pagination.params';

describe(RoomPaginationParams.name, () => {
	it('should default to a limit of 500', () => {
		const params = new RoomPaginationParams();

		expect(params.limit).toBe(500);
	});

	it('should accept a limit of 500', async () => {
		const params = Object.assign(new RoomPaginationParams(), { limit: 500 });

		const errors = await validate(params);

		expect(errors).toHaveLength(0);
	});

	it.each([0, 501])('should reject a limit of %s', async (limit) => {
		const params = Object.assign(new RoomPaginationParams(), { limit });

		const errors = await validate(params);

		expect(errors).toHaveLength(1);
	});
});
