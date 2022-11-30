import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountModule } from './account.module';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';
import { AccountUc } from './uc/account.uc';

describe('AccountModule', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let accountService: AccountService;
	let accountValidationService: AccountValidationService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				AccountModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
			// imports: [AccountModule],
			// providers: [
			// 	{
			// 		provide: Logger,
			// 		useValue: createMock<Logger>(),
			// 	},
			// 	{
			// 		provide: ConfigService,
			// 		useValue: createMock<ConfigService<IServerConfig, true>>(),
			// 	},
			// ],
		}).compile();
		accountUc = module.get(AccountUc);
		accountService = module.get(AccountService);
		accountValidationService = module.get(AccountValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the account UC defined', () => {
		expect(accountUc).toBeDefined();
	});

	it('should have the account service defined', () => {
		expect(accountService).toBeDefined();
	});

	it('should have the account validation service defined', () => {
		expect(accountValidationService).toBeDefined();
	});
});
