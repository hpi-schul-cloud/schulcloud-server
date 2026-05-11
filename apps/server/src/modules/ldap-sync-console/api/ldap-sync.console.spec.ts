import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@infra/console';

// Mock the UC module to avoid loading legacy Feathers code which has problematic imports
jest.mock('./ldap-sync.uc', () => {
	return {
		LdapSyncUc: jest.fn().mockImplementation(() => {
			return {
				runLdapSync: jest.fn(),
			};
		}),
	};
});

import { LdapSyncConsole } from './ldap-sync.console';
import { LdapSyncUc } from './ldap-sync.uc';

describe(LdapSyncConsole.name, () => {
	let module: TestingModule;
	let console: LdapSyncConsole;
	let ldapSyncUc: DeepMocked<LdapSyncUc>;
	let consoleWriter: DeepMocked<ConsoleWriterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LdapSyncConsole,
				{
					provide: LdapSyncUc,
					useValue: createMock<LdapSyncUc>(),
				},
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
			],
		}).compile();

		console = module.get(LdapSyncConsole);
		ldapSyncUc = module.get(LdapSyncUc);
		consoleWriter = module.get(ConsoleWriterService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when console is initialized', () => {
		it('should be defined', () => {
			expect(console).toBeDefined();
		});
	});

	describe('sync', () => {
		describe('when called without deltaSync flag (default full sync)', () => {
			const setup = () => {
				const options = { deltaSync: false };
				const stats = { success: true, errors: [], systems: {} };
				ldapSyncUc.runLdapSync.mockResolvedValueOnce(stats);

				return { options, stats };
			};

			it('should call runLdapSync with forceFullSync=true', async () => {
				const { options } = setup();

				await console.sync(options);

				expect(ldapSyncUc.runLdapSync).toHaveBeenCalledWith(true);
			});

			it('should log start and finish messages', async () => {
				const { options } = setup();

				await console.sync(options);

				expect(consoleWriter.info).toHaveBeenCalledTimes(2);
				expect(consoleWriter.info).toHaveBeenNthCalledWith(
					1,
					expect.stringContaining('"message":"Starting LDAP synchronization"')
				);
				expect(consoleWriter.info).toHaveBeenNthCalledWith(
					2,
					expect.stringContaining('"message":"LDAP synchronization finished"')
				);
			});
		});

		describe('when called with deltaSync=true', () => {
			const setup = () => {
				const options = { deltaSync: true };
				const stats = { success: true, errors: [], systems: {} };
				ldapSyncUc.runLdapSync.mockResolvedValueOnce(stats);

				return { options, stats };
			};

			it('should call runLdapSync with forceFullSync=false', async () => {
				const { options } = setup();

				await console.sync(options);

				expect(ldapSyncUc.runLdapSync).toHaveBeenCalledWith(false);
			});
		});

		describe('when called with deltaSync="true" as string', () => {
			const setup = () => {
				const options = { deltaSync: 'true' as unknown as boolean };
				const stats = { success: true, errors: [], systems: {} };
				ldapSyncUc.runLdapSync.mockResolvedValueOnce(stats);

				return { options, stats };
			};

			it('should call runLdapSync with forceFullSync=false', async () => {
				const { options } = setup();

				await console.sync(options);

				expect(ldapSyncUc.runLdapSync).toHaveBeenCalledWith(false);
			});
		});

		describe('when sync returns errors', () => {
			const setup = () => {
				const options = { deltaSync: false };
				const stats = {
					success: false,
					errors: ['Error 1', 'Error 2'],
					systems: { ldap1: { success: false } },
				};
				ldapSyncUc.runLdapSync.mockResolvedValueOnce(stats);

				return { options, stats };
			};

			it('should log the stats including errors', async () => {
				const { options, stats } = setup();

				await console.sync(options);

				expect(consoleWriter.info).toHaveBeenNthCalledWith(2, expect.stringContaining(JSON.stringify(stats)));
			});
		});
	});
});
