import { MikroORM } from '@mikro-orm/core';
import { Test, type TestingModule } from '@nestjs/testing';

const mockRunLegacyLdapSync = jest.fn();
jest.mock('@imports-from-feathers', () => {
	return {
		runLegacyLdapSync: mockRunLegacyLdapSync,
	};
});

import { ConsoleWriterService } from '@infra/console';
import { LdapSyncConsoleAppTestModule } from '../ldap-sync-console.app.module';
import { LdapSyncConsole } from './ldap-sync.console';

describe(LdapSyncConsole.name, () => {
	let module: TestingModule;
	let consoleService: LdapSyncConsole;
	let orm: MikroORM;
	let consoleWriter: ConsoleWriterService;
	let mockExit: jest.SpyInstance;

	beforeAll(async () => {
		// Mock process.exit to prevent test from exiting
		mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

		module = await Test.createTestingModule({
			imports: [LdapSyncConsoleAppTestModule],
		}).compile();

		consoleService = module.get(LdapSyncConsole);
		orm = module.get(MikroORM);
		consoleWriter = module.get(ConsoleWriterService);
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runAllTimers();
		jest.useRealTimers();
	});

	afterAll(async () => {
		mockExit.mockRestore();
		await module.close();
	});

	describe('when console is initialized', () => {
		it('should be defined', () => {
			expect(consoleService).toBeDefined();
		});
	});

	describe('sync', () => {
		describe('when called without deltaSync flag (default full sync)', () => {
			const setup = () => {
				const options = { deltaSync: false };
				const stats = { success: true, errors: [], systems: {} };
				mockRunLegacyLdapSync.mockResolvedValueOnce(stats);

				return { options, stats };
			};

			it('should call runLdapSync with forceFullSync=true', async () => {
				const { options } = setup();

				await consoleService.sync(options);

				expect(mockRunLegacyLdapSync).toHaveBeenCalledWith(orm, { forceFullSync: true });
			});

			it('should log start and finish messages', async () => {
				const { options } = setup();
				const spy = jest.spyOn(consoleWriter, 'info');

				await consoleService.sync(options);

				expect(spy).toHaveBeenCalledTimes(2);
				expect(spy).toHaveBeenNthCalledWith(1, expect.stringContaining('"message":"Starting LDAP synchronization"'));
				expect(spy).toHaveBeenNthCalledWith(2, expect.stringContaining('"message":"LDAP synchronization finished"'));
			});
		});
	});
});
