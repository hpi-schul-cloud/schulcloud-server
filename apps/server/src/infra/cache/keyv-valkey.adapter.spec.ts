import { createMock, DeepMocked } from '@golevelup/ts-jest';
import Redis from 'iovalkey';
import { KeyvValkeyAdapter } from './keyv-valkey.adapter';

describe(KeyvValkeyAdapter.name, () => {
	let redisMock: DeepMocked<Redis>;
	let keyvValkeyAdapter: KeyvValkeyAdapter;

	describe('keys', () => {
		describe('when redis instance is available', () => {
			const setup = () => {
				redisMock = createMock<Redis>({
					keys: jest.fn(),
				});

				keyvValkeyAdapter = new KeyvValkeyAdapter(redisMock);
			};
			it('should return keys matching the pattern', async () => {
				setup();
				const pattern = 'test:*';
				const expectedKeys = ['test:1', 'test:2'];
				redisMock.keys.mockResolvedValue(expectedKeys);

				const result = await keyvValkeyAdapter.keys(pattern);

				expect(redisMock.keys).toHaveBeenCalledWith(pattern);
				expect(result).toEqual(expectedKeys);
			});

			it('should return an empty array if no keys match the pattern', async () => {
				setup();
				const pattern = 'nonexistent:*';
				redisMock.keys.mockResolvedValue([]);

				const result = await keyvValkeyAdapter.keys(pattern);

				expect(redisMock.keys).toHaveBeenCalledWith(pattern);
				expect(result).toEqual([]);
			});
		});

		describe('when redis instance is not available', () => {
			it('should return an empty array', async () => {
				keyvValkeyAdapter = new KeyvValkeyAdapter({});

				const pattern = 'test:*';
				const result = await keyvValkeyAdapter.keys(pattern);

				expect(result).toEqual([]);
			});
		});
	});
});
