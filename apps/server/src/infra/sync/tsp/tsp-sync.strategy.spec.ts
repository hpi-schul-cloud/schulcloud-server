import { TestingModule, Test } from '@nestjs/testing';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: TspSyncStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [TspSyncStrategy],
		}).compile();

		strategy = module.get(TspSyncStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when tsp sync strategy is initialized', () => {
		it('should be defined', () => {
			expect(strategy).toBeDefined();
		});
	});

	describe('getType', () => {
		it('should return tsp', () => {
			expect(strategy.getType()).toBe(SyncStrategyTarget.TSP);
		});
	});

	describe('sync', () => {
		it('should return a promise', async () => {
			const result = strategy.sync();
			expect(result).toBeInstanceOf(Promise);
		});
	});
});
