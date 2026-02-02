import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageClient } from '@infra/valkey-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SESSION_VALKEY_CLIENT } from '../authentication-config';
import { JwtWhitelistAdapter } from './jwt-whitelist.adapter';

describe(JwtWhitelistAdapter.name, () => {
	let module: TestingModule;
	let jwtWhitelistAdapter: JwtWhitelistAdapter;

	let valkeyClient: DeepMocked<StorageClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtWhitelistAdapter,
				{
					provide: SESSION_VALKEY_CLIENT,
					useValue: createMock<StorageClient>(),
				},
			],
		}).compile();

		valkeyClient = module.get(SESSION_VALKEY_CLIENT);
		jwtWhitelistAdapter = module.get(JwtWhitelistAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('addToWhitelist', () => {
		describe('when adding jwt to the whitelist', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				const expirationInSeconds = 7200;

				return {
					accountId,
					jti,
					expirationInSeconds,
				};
			};

			it('should call the cache manager to set the jwt from the cache', async () => {
				const { accountId, jti, expirationInSeconds } = setup();

				await jwtWhitelistAdapter.addToWhitelist(accountId, jti);

				expect(valkeyClient.set).toHaveBeenCalledWith(
					`jwt:${accountId}:${jti}`,
					JSON.stringify({
						IP: 'NONE',
						Browser: 'NONE',
						Device: 'NONE',
						privateDevice: false,
						expirationInSeconds: expirationInSeconds,
					}),
					'EX',
					expirationInSeconds
				);
			});
		});
	});

	describe('removeFromWhitelist', () => {
		describe('when removing a token from the whitelist', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				return {
					accountId,
					jti,
				};
			};

			it('should call the cache manager to remove the jwt from the cache', async () => {
				const { accountId, jti } = setup();

				await jwtWhitelistAdapter.removeFromWhitelist(accountId, jti);

				expect(valkeyClient.del).toHaveBeenCalledWith(`jwt:${accountId}:${jti}`);
			});
		});

		describe('when removing a token from the whitelist', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const jwtKey1 = `jwt:${accountId}:jti1`;
				const jwtKey2 = `jwt:${accountId}:jti2`;

				valkeyClient.keys.mockResolvedValueOnce([jwtKey1, jwtKey2]);

				return {
					accountId,
					jwtKey1,
					jwtKey2,
				};
			};

			it('should call the cache manager to delete all jwt entries from the cache', async () => {
				const { accountId, jwtKey1, jwtKey2 } = setup();

				await jwtWhitelistAdapter.removeFromWhitelist(accountId);

				expect(valkeyClient.del).toHaveBeenNthCalledWith(1, jwtKey1);
				expect(valkeyClient.del).toHaveBeenNthCalledWith(2, jwtKey2);
			});
		});
	});
});
