import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { SyncUc } from './sync.uc';
import { SyncService } from '../service/sync.service';

describe(SyncUc.name, () => {
	let module: TestingModule;
	let uc: SyncUc;
	let service: SyncService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SyncUc,
				{
					provide: SyncService,
					useValue: createMock<SyncService>({}),
				},
			],
		}).compile();
		uc = module.get(SyncUc);
		service = module.get(SyncService);
	});

	describe('when sync uc is initialized', () => {
		it('should be defined', () => {
			expect(uc).toBeDefined();
		});
	});

	describe('startSync', () => {
		const setup = () => {
			const validTarget = 'tsp';

			return { validTarget };
		};

		describe('when calling startSync', () => {
			it('should call sync method', async () => {
				const { validTarget } = setup();
				await uc.startSync(validTarget);
				expect(service.startSync).toHaveBeenCalledWith(validTarget);
			});
		});
	});
});
