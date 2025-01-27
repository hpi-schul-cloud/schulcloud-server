import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Logger } from '@core/logger';
import { InvalidTargetLoggable } from '../errors/invalid-target.loggable';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSyncStrategy } from '../tsp';
import { MediaMetadataSyncStrategy } from '../media-metadata';
import { VidisSyncStrategy } from '../media-licenses';
import { SyncService } from './sync.service';

describe(SyncService.name, () => {
	let module: TestingModule;
	let service: SyncService;
	let tspSyncStrategy: TspSyncStrategy;
	let vidisSyncStrategy: VidisSyncStrategy;
	let mediaMedataSyncStrategy: MediaMetadataSyncStrategy;
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
					provide: VidisSyncStrategy,
					useValue: createMock<VidisSyncStrategy>({
						getType(): SyncStrategyTarget {
							return SyncStrategyTarget.VIDIS;
						},
						sync(): Promise<void> {
							return Promise.resolve();
						},
					}),
				},
				{
					provide: MediaMetadataSyncStrategy,
					useValue: createMock<MediaMetadataSyncStrategy>({
						getType(): SyncStrategyTarget {
							return SyncStrategyTarget.MEDIA_METADATA;
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
		vidisSyncStrategy = module.get(VidisSyncStrategy);
		mediaMedataSyncStrategy = module.get(MediaMetadataSyncStrategy);
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
				const strategyMap = new Map<SyncStrategyTarget, SyncStrategy>([
					[SyncStrategyTarget.TSP, tspSyncStrategy],
					[SyncStrategyTarget.VIDIS, vidisSyncStrategy],
					[SyncStrategyTarget.MEDIA_METADATA, mediaMedataSyncStrategy],
				]);

				Reflect.set(service, 'strategies', strategyMap);

				return { strategyMap };
			};

			it.each([SyncStrategyTarget.TSP, SyncStrategyTarget.VIDIS, SyncStrategyTarget.MEDIA_METADATA])(
				'call sync method of %s',
				async (strategyTarget: SyncStrategyTarget) => {
					const { strategyMap } = setup();
					await service.startSync(strategyTarget);

					const strategy = strategyMap.get(strategyTarget) as SyncStrategy;

					expect(strategy.sync).toHaveBeenCalled();
				}
			);
		});
	});
});
