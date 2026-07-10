import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { AccountModule } from './account.module';
import { AccountService } from './domain/services/account.service';
import { AccountEntity } from './repo';

describe('AccountModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [AccountModule, MongoMemoryDatabaseModule.forRoot({ entities: [AccountEntity] })],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the account service defined', () => {
		const accountService = module.get(AccountService);
		expect(accountService).toBeDefined();
	});
});
