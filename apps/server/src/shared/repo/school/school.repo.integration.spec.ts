import { Test, TestingModule } from '@nestjs/testing';
import { School } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SchoolRepo } from '..';

describe('school repo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolRepo],
		}).compile();
		repo = module.get(SchoolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(School);
	});
});
