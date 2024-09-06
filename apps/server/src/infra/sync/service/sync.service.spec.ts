import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Logger } from '@src/core/logger';
import { SyncService } from './sync.service';
import { TspSyncStrategy } from '../tsp/tsp-sync.strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { InvalidTargetLoggable } from '../errors/invalid-target.loggable';

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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
				const validSystem = 'tsp';
				Reflect.set(service, 'strategies', new Map([[SyncStrategyTarget.TSP, tspSyncStrategy]]));

				return { validSystem };
			};

			it('should call sync method of the provided target', async () => {
				const { validSystem } = setup();
				await service.startSync(validSystem);

				expect(tspSyncStrategy.sync).toHaveBeenCalled();
			});
		});
	});
});
