import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { SyncUc } from '../uc/sync.uc';
import { SyncConsole } from './sync.console';

describe(SyncConsole.name, () => {
	let syncConsole: SyncConsole;
	let syncUc: SyncUc;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [
				SyncConsole,
				{
					provide: SyncUc,
					useValue: createMock<SyncUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		syncConsole = module.get(SyncConsole);
		syncUc = module.get(SyncUc);
	});

	describe('when sync console is initialized', () => {
		it('should be defined', () => {
			expect(syncConsole).toBeDefined();
		});
	});

	describe('startSync', () => {
		const setup = () => {
			const target = 'tsp';
			return { target };
		};

		it('should call startSync method of syncUc', async () => {
			const { target } = setup();
			await syncConsole.startSync(target);

			expect(syncUc.startSync).toHaveBeenCalledWith(target);
		});
	});
});
