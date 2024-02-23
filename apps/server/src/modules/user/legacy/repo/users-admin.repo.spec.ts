import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { User } from '@shared/domain/entity';
import { EntityManager } from '@mikro-orm/mongodb';
import { UsersSearchQueryParams } from '../controller/dto';
import { UsersAdminRepo } from './users-admin.repo';

describe('users admin repo', () => {
	let module: TestingModule;
	let repo: UsersAdminRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UsersAdminRepo],
		}).compile();
		repo = module.get(UsersAdminRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getUserByIdWithNestedData).toEqual('function');
		expect(typeof repo.getUsersWithNestedData).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('when searching by searchQuery', () => {
		const setup = () => {
			const aggregationSpy = jest.spyOn(em, 'aggregate');

			const exampleId = '5fa31aacb229544f2c697b48';

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				searchQuery: 'test',
			};

			return {
				queryParams,
				aggregationSpy,
				exampleId,
			};
		};

		it('should provide match for score text search in aggregation', async () => {
			const { queryParams, aggregationSpy, exampleId } = setup();

			await repo.getUsersWithNestedData(exampleId, exampleId, exampleId, queryParams);

			expect(aggregationSpy).toHaveBeenCalledWith('pipeline', expect.stringContaining('$match: { score: { $gte:'));
		});
	});
});
