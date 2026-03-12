import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InMemoryClient, StorageClient } from '@infra/valkey-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_GUARD_VALKEY_CLIENT, JWT_WHITELIST_CONFIG_TOKEN } from '../auth-guard.constants';
import { createJwtRedisData, JwtRedisData } from '../helper';
import { InternalJwtWhitelistConfig } from '../interface';
import { JwtValidationAdapter } from './jwt-validation.adapter';

describe(JwtValidationAdapter.name, () => {
	let module: TestingModule;
	let adapter: JwtValidationAdapter;
	let storageClient: DeepMocked<StorageClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtValidationAdapter,
				{
					provide: AUTH_GUARD_VALKEY_CLIENT,
					useValue: createMock<StorageClient>(),
				},
				{
					provide: JWT_WHITELIST_CONFIG_TOKEN,
					useValue: { jwtTimeoutSeconds: 7200 },
				},
			],
		}).compile();

		storageClient = module.get(AUTH_GUARD_VALKEY_CLIENT);
		adapter = module.get(JwtValidationAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('isWhitelisted', () => {
		describe('when the token exists in the whitelist', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();
				const redisData: JwtRedisData = createJwtRedisData(7200);

				storageClient.get.mockResolvedValueOnce(JSON.stringify(redisData));

				return { accountId, jti, redisData };
			};

			it('should extend the token expiration and return without throwing', async () => {
				const { accountId, jti, redisData } = setup();

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
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				storageClient.get.mockResolvedValueOnce(null);

				return { accountId, jti };
			};

			it('should throw UnauthorizedException', async () => {
				const { accountId, jti } = setup();

				await expect(adapter.isWhitelisted(accountId, jti)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when the storage client is an InMemoryClient', () => {
			let inMemoryModule: TestingModule;
			let inMemoryAdapter: JwtValidationAdapter;

			beforeAll(async () => {
				inMemoryModule = await Test.createTestingModule({
					providers: [
						JwtValidationAdapter,
						{
							provide: AUTH_GUARD_VALKEY_CLIENT,
							useValue: new InMemoryClient(createMock()),
						},
						{
							provide: JWT_WHITELIST_CONFIG_TOKEN,
							useValue: { jwtTimeoutSeconds: 7200 } as InternalJwtWhitelistConfig,
						},
					],
				}).compile();

				inMemoryAdapter = inMemoryModule.get(JwtValidationAdapter);
			});

			afterAll(async () => {
				await inMemoryModule.close();
			});

			it('should skip the whitelist check and return without throwing', async () => {
				const accountId = new ObjectId().toHexString();
				const jti = new ObjectId().toHexString();

				await expect(inMemoryAdapter.isWhitelisted(accountId, jti)).resolves.toBeUndefined();
			});
		});
	});
});
