import { type DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import Valkey, { type Redis } from 'iovalkey';
import { ValkeyClient } from './valkey.client';

describe('ValkeyClient', () => {
	let redisMock: DeepMocked<Redis>;
	let valkeyClient: ValkeyClient;

	beforeEach(() => {
		redisMock = createMock<Redis>();

		valkeyClient = new ValkeyClient(redisMock);
	});

	describe('application shutdown', () => {
		it('should disconnect a factory-provided client when its Nest context closes', async () => {
			const module = await Test.createTestingModule({
				providers: [{ provide: 'STORAGE_CLIENT', useFactory: () => valkeyClient }],
			}).compile();
			await module.init();

			await module.close();

			expect(redisMock.disconnect).toHaveBeenCalledTimes(1);
			expect(redisMock.disconnect).toHaveBeenCalledWith();
		});

		it('should propagate disconnect failures from the shutdown hook', () => {
			const error = new Error('disconnect failed');
			redisMock.disconnect.mockImplementation(() => {
				throw error;
			});

			expect(() => valkeyClient.onApplicationShutdown()).toThrow(error);
		});

		it('should stop a real lazy client without opening a connection', () => {
			const redis = new Valkey({ lazyConnect: true });
			const client = new ValkeyClient(redis);
			const connect = jest.spyOn(redis, 'connect');
			try {
				client.onApplicationShutdown();

				expect(redis.status).toBe('end');
				expect(connect).not.toHaveBeenCalled();
			} finally {
				redis.disconnect();
			}
		});
	});

	describe('GET', () => {
		it('should return the value for a given key', async () => {
			redisMock.get.mockResolvedValue('value');

			const result = await valkeyClient.get('key');

			expect(redisMock.get).toHaveBeenCalledWith('key');
			expect(result).toBe('value');
		});

		it('should return null if the key does not exist', async () => {
			redisMock.get.mockResolvedValue(null);

			const result = await valkeyClient.get('nonexistent');

			expect(redisMock.get).toHaveBeenCalledWith('nonexistent');
			expect(result).toBeNull();
		});
	});

	describe('SET', () => {
		it('should set a value with expiration', async () => {
			await valkeyClient.set('key', 'value', 60);

			expect(redisMock.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
		});

		it('should set a value without expiration', async () => {
			await valkeyClient.set('key', 'value');

			expect(redisMock.set).toHaveBeenCalledWith('key', 'value');
		});
	});

	describe('DEL', () => {
		it('should delete a key and return the number of keys deleted', async () => {
			redisMock.del.mockResolvedValue(1);

			const result = await valkeyClient.del('key');

			expect(redisMock.del).toHaveBeenCalledWith('key');
			expect(result).toBe(1);
		});
	});

	describe('TTL', () => {
		it('should return the TTL of a key', async () => {
			redisMock.ttl.mockResolvedValue(120);

			const result = await valkeyClient.ttl('key');

			expect(redisMock.ttl).toHaveBeenCalledWith('key');
			expect(result).toBe(120);
		});
	});

	describe('KEYS', () => {
		it('should return a list of keys matching a pattern', async () => {
			redisMock.keys.mockResolvedValue(['key1', 'key2']);

			const result = await valkeyClient.keys('key*');

			expect(redisMock.keys).toHaveBeenCalledWith('key*');
			expect(result).toEqual(['key1', 'key2']);
		});
	});

	describe('ON', () => {
		it('should register an event listener', () => {
			const callback = jest.fn<void, [Error]>();
			valkeyClient.on('error', callback);
			expect(redisMock.on).toHaveBeenCalledWith('error', callback);
		});
	});
});
