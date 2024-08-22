import { LegacyLogger } from '@src/core/logger';
import { RedisIoAdapter } from './redis-ioadapter';

jest.mock('@src/core/logger', () => {
	return {
		LegacyLogger: jest.fn().mockImplementation(() => {
			return {
				error: jest.fn(),
			};
		}),
	};
});

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
		const legacyLogger = { error: jest.fn() } as unknown as LegacyLogger;
		const redisIoAdapter = new RedisIoAdapter(legacyLogger);
		return { redisIoAdapter, legacyLogger };
	};

	describe('createIOServer', () => {
		it('should send several actions', () => {
			const { redisIoAdapter } = setup();

			redisIoAdapter.createIOServer(1234);

			expect(redisMock.on).toHaveBeenCalledTimes(6);
		});
	});
});
