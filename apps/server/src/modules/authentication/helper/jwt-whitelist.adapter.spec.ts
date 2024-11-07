import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { JwtWhitelistAdapter } from './jwt-whitelist.adapter';

describe(JwtWhitelistAdapter.name, () => {
	let module: TestingModule;
	let jwtWhitelistAdapter: JwtWhitelistAdapter;

	let cacheManager: DeepMocked<Cache>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtWhitelistAdapter,
				{
					provide: CACHE_MANAGER,
					useValue: createMock<Cache>(),
				},
			],
		}).compile();

		cacheManager = module.get(CACHE_MANAGER);
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
				const expirationInSeconds = Configuration.get('JWT_TIMEOUT_SECONDS') as number;

				return {
					accountId,
					jti,
					expirationInSeconds,
				};
			};

			it('should call the cache manager to set the jwt from the cache', async () => {
				const { accountId, jti, expirationInSeconds } = setup();

				await jwtWhitelistAdapter.addToWhitelist(accountId, jti);

				expect(cacheManager.set).toHaveBeenCalledWith(
					`jwt:${accountId}:${jti}`,
					{
						IP: 'NONE',
						Browser: 'NONE',
						Device: 'NONE',
						privateDevice: false,
						expirationInSeconds,
					},
					expirationInSeconds * 1000
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

				expect(cacheManager.del).toHaveBeenCalledWith(`jwt:${accountId}:${jti}`);
			});
		});

		describe('when removing a token from the whitelist', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();

				return {
					accountId,
				};
			};

			it('should call the cache manager to delete all jwt entries from the cache', async () => {
				const { accountId } = setup();

				await jwtWhitelistAdapter.removeFromWhitelist(accountId);

				expect(cacheManager.del).toHaveBeenCalledWith(`jwt:${accountId}:*`);
			});
		});
	});
});
