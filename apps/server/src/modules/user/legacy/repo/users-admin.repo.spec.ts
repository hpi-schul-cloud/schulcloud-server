import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { User } from '@shared/domain/entity';
import { UsersAdminRepo } from './users-admin.repo';

describe('users admin repo', () => {
	let module: TestingModule;
	let repo: UsersAdminRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UsersAdminRepo],
		}).compile();
		repo = module.get(UsersAdminRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getUserByIdWithNestedData).toEqual('function');
		expect(typeof repo.getUsersWithNestedData).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});
});
