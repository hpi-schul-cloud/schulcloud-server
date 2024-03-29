import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { AccountModule } from './account.module';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb, AccountIdmToDtoMapperIdm } from './mapper';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';

describe('AccountModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				AccountModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					isGlobal: true,
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the account service defined', () => {
		const accountService = module.get(AccountService);
		expect(accountService).toBeDefined();
	});

	it('should have the account validation service defined', () => {
		const accountValidationService = module.get(AccountValidationService);
		expect(accountValidationService).toBeDefined();
	});

	describe('when FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is enabled', () => {
		let moduleFeatureEnabled: TestingModule;

		beforeAll(async () => {
			moduleFeatureEnabled = await Test.createTestingModule({
				imports: [
					AccountModule,
					MongoMemoryDatabaseModule.forRoot(),
					ConfigModule.forRoot({
						ignoreEnvFile: true,
						ignoreEnvVars: true,
						isGlobal: true,
						validate: () => {
							return {
								FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: true,
							};
						},
					}),
				],
			}).compile();
		});

		afterAll(async () => {
			await moduleFeatureEnabled.close();
		});

		it('should use AccountIdmToDtoMapperIdm', () => {
			const mapper = moduleFeatureEnabled.get(AccountIdmToDtoMapper);
			expect(mapper).toBeInstanceOf(AccountIdmToDtoMapperIdm);
		});
	});

	describe('when FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is disabled', () => {
		let moduleFeatureDisabled: TestingModule;

		beforeAll(async () => {
			moduleFeatureDisabled = await Test.createTestingModule({
				imports: [
					AccountModule,
					MongoMemoryDatabaseModule.forRoot(),
					ConfigModule.forRoot({
						ignoreEnvFile: true,
						ignoreEnvVars: true,
						isGlobal: true,
						validate: () => {
							return {
								FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: false,
							};
						},
					}),
				],
			}).compile();
		});

		afterAll(async () => {
			await moduleFeatureDisabled.close();
		});

		it('should use AccountIdmToDtoMapperDb', () => {
			const mapper = moduleFeatureDisabled.get(AccountIdmToDtoMapper);
			expect(mapper).toBeInstanceOf(AccountIdmToDtoMapperDb);
		});
	});
});
