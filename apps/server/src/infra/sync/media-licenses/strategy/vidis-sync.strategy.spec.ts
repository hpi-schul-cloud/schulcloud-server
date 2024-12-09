import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisSyncService } from '../service';
import { VidisSyncStrategy } from './vidis-sync.strategy';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let sut: VidisSyncStrategy;
	// let vidisSyncStrategy: DeepMocked<VidisSyncStrategy>;
	let vidisSyncService: DeepMocked<VidisSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncStrategy,
				{
					provide: VidisSyncService,
					useValue: createMock<VidisSyncService>(),
				},
			],
		}).compile();

		sut = module.get(VidisSyncStrategy);
		vidisSyncService = module.get(VidisSyncService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when vidis sync strategy is initialized', () => {
		it('should be defined', () => {
			expect(sut).toBeDefined();
		});
	});

	describe('getType', () => {
		describe('when vidis sync strategy is initialized', () => {
			it('should return vidis', () => {
				expect(sut.getType()).toBe(SyncStrategyTarget.VIDIS);
			});
		});
	});

	describe('sync', () => {
		describe('when sync is called', () => {
			const setup = () => {};

			it('should find the vidis system', async () => {});
		});
	});
});
