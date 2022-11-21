import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { Logger } from '@src/core/logger';
import { AccountService } from './account.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;

	const account: AccountSaveDto = {
		username: 'john.doe@mail.tld',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [
						() => ({
							FEATURE_KEYCLOAK_IDENTITY_STORE_ENABLED: true,
						}),
					],
				}),
				MongoMemoryDatabaseModule.forRoot(),
				IdentityManagementModule,
			],
			providers: [
				AccountRepo,
				AccountService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('should mirror create, update and delete operations into the IDM', () => {
		it('save should create a new account', async () => {
			const result = await accountService.save(account);

			expect(result).toBeDefined();
		});

		it('save should update existing account', async () => {});
		it('updateUsername should update user name', async () => {});
		it('updatePassword should update password', async () => {});
		it('delete should remove account', async () => {});
		it('deleteByUserId should remove account', async () => {});
	});
});
