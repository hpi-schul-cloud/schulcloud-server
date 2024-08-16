import { Redis } from 'ioredis';
import { RedisIoAdapter } from './redis-ioadapter';

const redisMock = {
	on: jest.fn(),
	psubscribe: jest.fn(),
	subscribe: jest.fn(),
};
jest.mock('ioredis', () => {
	return {
		Redis: jest.fn().mockImplementation(() => redisMock),
	};
});

describe('RedisIoAdapter', () => {
	const setup = () => {
		const redisClient = new Redis();
		const redisIoAdapter = new RedisIoAdapter(redisClient);
		return { redisIoAdapter };
	};

	describe('createIOServer', () => {
		it('should ...', () => {
			const { redisIoAdapter } = setup();

			redisIoAdapter.createIOServer(1234);

			expect(redisMock.on).toHaveBeenCalledTimes(6);
		});
	});
});
