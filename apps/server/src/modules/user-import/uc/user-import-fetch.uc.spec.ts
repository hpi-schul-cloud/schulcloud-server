import { MongoMemoryDatabaseModule } from '@infra/database';
import { Test, TestingModule } from '@nestjs/testing';
import { UserImportFetchUc } from './user-import-fetch.uc';

describe(UserImportFetchUc.name, () => {
	let module: TestingModule;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let uc: UserImportFetchUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UserImportFetchUc],
		}).compile();

		uc = module.get(UserImportFetchUc);
	});

	// TODO: test it
	describe('fetchImportUsers', () => {});
});
