import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from './account.repo';

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: AccountRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [AccountRepo],
		}).compile();
		repo = module.get(AccountRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});
});
