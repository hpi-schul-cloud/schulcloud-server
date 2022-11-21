import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { WinstonModule } from 'nest-winston';
import { AccountService } from './account.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let configServiceMock: DeepMocked<ConfigService>;

	const account: AccountSaveDto = {
		username: 'john.doe@mail.tld',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [WinstonModule.forRoot({}), MongoMemoryDatabaseModule.forRoot(), IdentityManagementModule],
			providers: [
				AccountRepo,
				AccountService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('should mirror create, update and delete operations into the IDM', () => {
		beforeAll(() => {
			configServiceMock.get.mockReturnValue(true);
		});

		afterAll(() => {
			configServiceMock.get.mockRestore();
		});

		it('save should create a new account', async () => {
			const result = await accountService.save(account);

			expect(result).toBeDefined();
		});
	});
});
