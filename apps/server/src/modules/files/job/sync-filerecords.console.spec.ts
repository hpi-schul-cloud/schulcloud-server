import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { SyncFilesUc } from '../uc';
import { SyncFilesConsole } from './sync-filerecords.console';

describe('SyncFilesConsole', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let console: SyncFilesConsole;
	let uc: SyncFilesUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [SyncFilesConsole],
			providers: [
				{
					provide: SyncFilesUc,
					useValue: createMock<SyncFilesUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		console = module.get(SyncFilesConsole);
		uc = module.get(SyncFilesUc);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('syncFilesForTasks', () => {
		it('should call syncFilesForTasks', async () => {
			await console.syncFilesForTasks();
			expect(uc.syncFilesForTasks).toHaveBeenCalledTimes(1);
		});
	});
});
