import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InMemoryClient } from './in-memory.client';

describe(InMemoryClient.name, () => {
	let client: InMemoryClient;
	let logger: DeepMocked<Logger>;

	beforeEach(() => {
		logger = createMock<Logger>();
		client = new InMemoryClient(logger);
	});

	describe('SET', () => {
		const setup = () => {
			const key = 'key1';
			const value = 'value1';
			const args = ['EX', 60];
			return { key, value, args };
		};

		it('should set a value and log it', async () => {
			const { key, value, args } = setup();

			await client.set(key, value, args);

			expect(logger.warning).toHaveBeenCalledWith(expect.anything());
		});
	});

	describe('GET', () => {
		const setup = async () => {
			const key = 'key1';
			const value = 'value1';
			await client.set(key, value);

			return { key, value };
		};

		it('should set and get a value', async () => {
			const { key, value } = await setup();

			const result = await client.get(key);

			expect(result).toBe(value);
			expect(logger.warning).toHaveBeenCalledWith(expect.anything());
		});

		it('should return null for a non-existent key', async () => {
			const value = await client.get('nonExistentKey');

			expect(value).toBeNull();
		});
	});

	describe('DEL', () => {
		const setup = async () => {
			const key = 'keyToDelete';
			const value = 'valueToDelete';
			await client.set(key, value);

			return { key, value };
		};

		it('should delete a key and return 1 if it exists', async () => {
			const { key } = await setup();

			const result = await client.del(key);
			expect(result).toBe(1);

			const value = await client.get(key);
			expect(value).toBeNull();
		});

		it('should return 0 when deleting a non-existent key', async () => {
			const result = await client.del('nonExistentKey');
			expect(result).toBe(0);
		});
	});

	describe('KEYS', () => {
		const setup = async () => {
			const key1 = 'key1';
			const key2 = 'key2';

			await client.set(key1, 'value1');
			await client.set(key2, 'value2');
			await client.set('anotherKey', 'value3');
			return { key1, key2 };
		};

		it('should return keys matching a pattern', async () => {
			const { key1, key2 } = await setup();

			const keys = await client.keys('key*');

			expect(keys).toEqual(expect.arrayContaining([key1, key2]));
			expect(keys).not.toContain('anotherKey');
		});
	});

	describe('TTL', () => {
		const setup = async () => {
			const keyWithTTL = 'keyWithTTL';

			await client.set(keyWithTTL, 'value', 'EX', 60);
			return { keyWithTTL };
		};

		it('should set and retrieve TTL for a key', async () => {
			const { keyWithTTL } = await setup();

			const ttl = await client.ttl(keyWithTTL);

			expect(ttl).toBe(60);
		});

		it('should return -1 for TTL of a non-existent key', async () => {
			const ttl = await client.ttl('nonExistentKey');

			expect(ttl).toBe(-1);
		});
	});
});
