import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { InvalidTargetLoggable } from '../errors/invalid-target.loggable';
import { SyncStrategy } from '../strategy/sync-strategy';
import { TspSyncStrategy } from '../strategy/tsp/tsp-sync.strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { SYNC_CONFIG_TOKEN } from '../sync.config';
import { SyncService } from './sync.service';

describe(SyncService.name, () => {
	let module: TestingModule;
	let service: SyncService;
	let tspSyncStrategy: TspSyncStrategy;
	let logger: Logger;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SyncService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SYNC_CONFIG_TOKEN,
					useValue: {
						tspSyncEnabled: true,
					},
				},
				{
					provide: TspSyncStrategy,
					useValue: createMock<TspSyncStrategy>({
						getType(): SyncStrategyTarget {
							return SyncStrategyTarget.TSP;
						},
						sync(): Promise<void> {
							return Promise.resolve();
						},
					}),
				},
			],
		}).compile();

		service = module.get(SyncService);
		tspSyncStrategy = module.get(TspSyncStrategy);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when sync service is initialized', () => {
		it('should be defined', () => {
			expect(service).toBeDefined();
		});
	});

	describe('startSync', () => {
		describe('when provided target is invalid or the sync is deactivated', () => {
			const setup = () => {
				const invalidTarget = faker.lorem.word();
				const output = new InvalidTargetLoggable(invalidTarget);

				return { output, invalidTarget };
			};

			it('should throw an invalid provided target error', async () => {
				const { output, invalidTarget } = setup();
				await service.startSync(invalidTarget);

				expect(logger.info).toHaveBeenCalledWith(output);
			});
		});

		describe('when provided target is valid and synchronization is activated', () => {
			const setup = () => {
				const strategyMap = new Map<SyncStrategyTarget, SyncStrategy>([[SyncStrategyTarget.TSP, tspSyncStrategy]]);

				Reflect.set(service, 'strategies', strategyMap);

				return { strategyMap };
			};

			it.each([SyncStrategyTarget.TSP])('call sync method of %s', async (strategyTarget: SyncStrategyTarget) => {
				const { strategyMap } = setup();
				await service.startSync(strategyTarget);

				const strategy = strategyMap.get(strategyTarget) as SyncStrategy;

				expect(strategy.sync).toHaveBeenCalled();
			});
		});
	});
});
