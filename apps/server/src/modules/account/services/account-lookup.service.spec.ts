import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementService } from '@infra/identity-management';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain/interface';
import { ObjectId } from '@mikro-orm/mongodb';
import { v1 } from 'uuid';
import { AccountLookupService } from './account-lookup.service';

describe('AccountLookupService', () => {
	let module: TestingModule;
	let accountLookupService: AccountLookupService;
	let idmServiceMock: DeepMocked<IdentityManagementService>;
	let configServiceMock: DeepMocked<ConfigService>;

	const internalId = new ObjectId().toHexString();
	const internalIdAsObjectId = new ObjectId(internalId);
	const externalId = v1();
	const accountMock: IdmAccount = {
		id: externalId,
		attDbcAccountId: internalId,
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountLookupService,
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();
		accountLookupService = module.get(AccountLookupService);
		idmServiceMock = module.get(IdentityManagementService);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getInternalId', () => {
		describe('when id is already an internal id as ObjectId', () => {
			it('should return the id as is', async () => {
				const result = await accountLookupService.getInternalId(internalIdAsObjectId);
				expect(result).toStrictEqual(internalIdAsObjectId);
			});
		});

		describe('when id is already an internal id as string', () => {
			it('should return the id as ObjectId', async () => {
				const result = await accountLookupService.getInternalId(internalId);
				expect(result).toBeInstanceOf(ObjectId);
				expect(result?.toHexString()).toBe(internalId);
			});
		});

		describe('when id is an external id and FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED is enabled', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(true);
				idmServiceMock.findAccountById.mockResolvedValue(accountMock);
			};

			it('should return the internal id', async () => {
				setup();
				const result = await accountLookupService.getInternalId(accountMock.id);
				expect(result).toBeInstanceOf(ObjectId);
				expect(result?.toHexString()).toBe(accountMock.attDbcAccountId);
			});
		});

		describe('when id is an external id and FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED is disabled', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(false);
			};

			it('should return null', async () => {
				setup();
				const result = await accountLookupService.getInternalId(accountMock.id);
				expect(result).toBeNull();
			});
		});
	});

	describe('getExternalId', () => {
		describe('when id is already an external id', () => {
			it('should return the id as is', async () => {
				const result = await accountLookupService.getExternalId(externalId);
				expect(result).toBe(externalId);
			});
		});

		describe('when id is an internal id and FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is enabled', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(true);
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(accountMock);
			};

			it('should return the external id', async () => {
				setup();
				const result = await accountLookupService.getExternalId(internalIdAsObjectId);
				expect(result).toBe(externalId);
			});
		});

		describe('when id is an internal id and FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is disabled', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(false);
			};

			it('should return null', async () => {
				setup();
				const result = await accountLookupService.getExternalId(internalIdAsObjectId);
				expect(result).toBeNull();
			});
		});
	});
});
