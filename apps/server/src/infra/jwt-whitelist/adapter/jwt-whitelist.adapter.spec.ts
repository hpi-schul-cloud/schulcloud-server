import { createMock } from '@golevelup/ts-jest';
import { StorageClient } from '@infra/valkey-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { UnauthorizedException } from '@nestjs/common';
import { createJwtRedisData, JwtRedisData } from '../helper';
import { JwtWhitelistAdapter } from './jwt-whitelist.adapter';

describe(JwtWhitelistAdapter.name, () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('addToWhitelist', () => {
		describe('when adding jwt to the whitelist', () => {
			const setup = () => {
				const storageClient = createMock<StorageClient>();
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				const expirationInSeconds = 7200;

				return { accountId, jti, expirationInSeconds, storageClient, adapter };
			};

			it('should call the storage client to set the jwt in the cache', async () => {
				const { accountId, jti, expirationInSeconds, storageClient, adapter } = setup();

				await adapter.addToWhitelist(accountId, jti);

				expect(storageClient.set).toHaveBeenCalledWith(
					`jwt:${accountId}:${jti}`,
					JSON.stringify({
						IP: 'NONE',
						Browser: 'NONE',
						Device: 'NONE',
						privateDevice: false,
						expirationInSeconds,
					}),
					'EX',
					expirationInSeconds
				);
			});
		});
	});

	describe('removeFromWhitelist', () => {
		describe('when removing a specific token from the whitelist', () => {
			const setup = () => {
				const storageClient = createMock<StorageClient>();
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				return { accountId, jti, storageClient, adapter };
			};

			it('should call the storage client to remove the jwt from the cache', async () => {
				const { accountId, jti, storageClient, adapter } = setup();

				await adapter.removeFromWhitelist(accountId, jti);

				expect(storageClient.del).toHaveBeenCalledWith(`jwt:${accountId}:${jti}`);
			});
		});

		describe('when removing all tokens for an account', () => {
			const setup = () => {
				const storageClient = createMock<StorageClient>();
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jwtKey1 = `jwt:${accountId}:jti1`;
				const jwtKey2 = `jwt:${accountId}:jti2`;

				storageClient.keys.mockResolvedValueOnce([jwtKey1, jwtKey2]);

				return { accountId, jwtKey1, jwtKey2, storageClient, adapter };
			};

			it('should call the storage client to delete all jwt entries from the cache', async () => {
				const { accountId, jwtKey1, jwtKey2, storageClient, adapter } = setup();

				await adapter.removeFromWhitelist(accountId);

				expect(storageClient.del).toHaveBeenNthCalledWith(1, jwtKey1);
				expect(storageClient.del).toHaveBeenNthCalledWith(2, jwtKey2);
			});
		});
	});

	describe('isWhitelisted', () => {
		describe('when the token exists in the whitelist', () => {
			const setup = () => {
				const storageClient = createMock<StorageClient>();
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				const redisData: JwtRedisData = createJwtRedisData(7200);

				storageClient.get.mockResolvedValueOnce(JSON.stringify(redisData));

				return { accountId, jti, redisData, storageClient, adapter };
			};

			it('should extend the token expiration and return without throwing', async () => {
				const { accountId, jti, redisData, storageClient, adapter } = setup();

				await expect(adapter.isWhitelisted(accountId, jti)).resolves.toBeUndefined();

				expect(storageClient.get).toHaveBeenCalledWith(`jwt:${accountId}:${jti}`);
				expect(storageClient.set).toHaveBeenCalledWith(
					`jwt:${accountId}:${jti}`,
					JSON.stringify(redisData),
					'EX',
					redisData.expirationInSeconds
				);
			});
		});

		describe('when the token does not exist in the whitelist', () => {
			const setup = () => {
				const storageClient = createMock<StorageClient>();
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				storageClient.get.mockResolvedValueOnce(null);

				return { accountId, jti, adapter };
			};

			it('should throw UnauthorizedException', async () => {
				const { accountId, jti, adapter } = setup();

				await expect(adapter.isWhitelisted(accountId, jti)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when the storage client is an InMemoryClient', () => {
			const setup = () => {
				const storageClient = new (class InMemoryClient {})() as StorageClient;
				const config = { jwtTimeoutSeconds: 7200 };
				const adapter = new JwtWhitelistAdapter(storageClient, config);
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				return { accountId, jti, adapter };
			};

			it('should skip the whitelist check and return without throwing', async () => {
				const { accountId, jti, adapter } = setup();

				await expect(adapter.isWhitelisted(accountId, jti)).resolves.toBeUndefined();
			});
		});
	});
});
