import { ConsoleWriterService } from '@src/infra/console';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { SyncUc } from '../uc/sync.uc';
import { SyncConsole } from './sync.console';

describe(SyncConsole.name, () => {
	let syncConsole: SyncConsole;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [
				SyncConsole,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
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
	});

	describe('when sync console is initialized', () => {
		it('should be defined', () => {
			expect(syncConsole).toBeDefined();
		});
	});
});
