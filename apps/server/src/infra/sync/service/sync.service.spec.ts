import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { SyncService } from './sync.service';
import { TspSyncStrategy } from '../tsp/tsp-sync.strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';

describe(SyncService.name, () => {
	let module: TestingModule;
	let service: SyncService;

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
			],
		}).compile();

		service = module.get(SyncService);
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
		const setup = () => {
			const error = new Error('please provide a valid target strategy name to start its synchronization process');
			const invalidSystem = faker.lorem.word();
			const validSystem = 'tsp';

			return { error, invalidSystem, validSystem };
		};
		describe('when provided target is invalid', () => {
			it('should throw an invalid provided target error', async () => {
				const { error, invalidSystem } = setup();
				await expect(service.startSync(invalidSystem)).rejects.toThrowError(error);
			});
		});

		describe('when provided target is valid', () => {
			it('should call sync method of the provided target', async () => {
				const { validSystem } = setup();
				const syncSpy = jest.spyOn(service.strategies.get(validSystem as SyncStrategyTarget)!, 'sync');
				await service.startSync(validSystem);
				expect(syncSpy).toHaveBeenCalled();
			});
		});
	});
});
