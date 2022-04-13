import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { OperationStatus, OperationStatusEnum } from '@shared/domain/entity/operation-status.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { OperationStatusRepo } from './operation-status.repo';

describe('TaskRepo', () => {
	let module: TestingModule;
	let repo: OperationStatusRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [OperationStatusRepo],
		}).compile();

		repo = module.get(OperationStatusRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(OperationStatus, {});
	});

	describe('When logging the start of an operation', () => {
		it('should create a new entry in the database', async () => {
			const created = await repo.LogOperationStart('things getting started');

			const result = await repo.findById(created.id);
			expect(result).toEqual(created);
		});

		it('should save the title', async () => {
			const result = await repo.LogOperationStart('things getting started');
			expect(result.title).toEqual('things getting started');
		});

		it('should set status to started', async () => {
			const result = await repo.LogOperationStart('things getting started');
			expect(result.status).toEqual(OperationStatusEnum.STARTED);
		});

		describe('when it is a sub operation', () => {
			it('should save reference to original operation', async () => {
				const metaOperation = await repo.LogOperationStart('main');
				const subOperation = await repo.LogOperationStart('subOperation', metaOperation.id);

				expect(subOperation.original).toBeDefined();
				if (subOperation.original) {
					expect(subOperation.original.id).toEqual(metaOperation.id);
				}
			});
		});
	});

	describe('When logging the success of an operation', () => {
		it('should create a new entry in the database', async () => {
			const start = await repo.LogOperationStart('main');
			const success = await repo.LogOperationSuccess('main', start.id);

			const result = await repo.findById(success.id);
			expect(result).toEqual(success);
		});

		it('should save the title', async () => {
			const start = await repo.LogOperationStart('main');
			const success = await repo.LogOperationSuccess('main', start.id);
			expect(success.title).toEqual('main');
		});

		it('should set status to successful', async () => {
			const start = await repo.LogOperationStart('main');
			const success = await repo.LogOperationSuccess('main', start.id);
			expect(success.status).toEqual(OperationStatusEnum.SUCCESSFUL);
		});

		it('should save reference to original operation', async () => {
			const metaOperation = await repo.LogOperationStart('main');
			const subOperation = await repo.LogOperationSuccess('subOperation', metaOperation.id);

			expect(subOperation.original).toBeDefined();
			if (subOperation.original) {
				expect(subOperation.original.id).toEqual(metaOperation.id);
			}
		});
	});

	describe('When logging the failure of an operation', () => {
		it('should create a new entry in the database', async () => {
			const start = await repo.LogOperationStart('main');
			const failure = await repo.LogOperationFailure('main', start.id);

			const result = await repo.findById(failure.id);
			expect(result).toEqual(failure);
		});

		it('should save the title', async () => {
			const start = await repo.LogOperationStart('main');
			const failure = await repo.LogOperationFailure('main', start.id);
			expect(failure.title).toEqual('main');
		});

		it('should set status to successful', async () => {
			const start = await repo.LogOperationStart('main');
			const failure = await repo.LogOperationFailure('main', start.id);
			expect(failure.status).toEqual(OperationStatusEnum.FAILED);
		});

		it('should save reference to original operation', async () => {
			const metaOperation = await repo.LogOperationStart('main');
			const subOperation = await repo.LogOperationFailure('subOperation', metaOperation.id);

			expect(subOperation.original).toBeDefined();
			if (subOperation.original) {
				expect(subOperation.original.id).toEqual(metaOperation.id);
			}
		});
	});

	describe('when reading the logs of an operation', () => {
		let operation: OperationStatus;
		let subEntries: OperationStatus[];
		let otherEntries: OperationStatus[];

		beforeEach(async () => {
			operation = await repo.LogOperationStart('bake');
			subEntries = await Promise.all([
				repo.LogOperationStart('prepare', operation.id),
				repo.LogOperationStart('turn on oven', operation.id),
				repo.LogOperationSuccess('prepare', operation.id),
				repo.LogOperationFailure('turn on oven', operation.id),
				repo.LogOperationFailure('bake', operation.id),
			]);
			otherEntries = await Promise.all([repo.LogOperationStart('cook')]);
		});

		it('should find the original entry', async () => {
			const [foundEntries] = await repo.FindOperationEntries(operation.id);
			expect(foundEntries.includes(operation)).toBe(true);
		});

		it('should find each of the sub entries', async () => {
			const [foundEntries] = await repo.FindOperationEntries(operation.id);
			subEntries.forEach((entry) => {
				expect(foundEntries.includes(entry)).toBe(true);
			});
		});

		it('should not find any other entries', async () => {
			const [foundEntries] = await repo.FindOperationEntries(operation.id);
			otherEntries.forEach((entry) => {
				expect(foundEntries.includes(entry)).toBe(false);
			});
		});
	});
});
