import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

const mockRunLegacyLdapSync = jest.fn();
jest.mock('@imports-from-feathers', () => {
	return {
		runLegacyLdapSync: mockRunLegacyLdapSync,
	};
});

// Mock process.exit to prevent test from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

import { LdapSyncUc } from './ldap-sync.uc';

describe(LdapSyncUc.name, () => {
	let module: TestingModule;
	let uc: LdapSyncUc;
	let logger: DeepMocked<Logger>;
	let orm: DeepMocked<MikroORM>;

	beforeAll(async () => {
		jest.useFakeTimers();

		module = await Test.createTestingModule({
			providers: [
				LdapSyncUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: MikroORM,
					useValue: createMock<MikroORM>(),
				},
			],
		}).compile();

		uc = module.get(LdapSyncUc);
		logger = module.get(Logger);
		orm = module.get(MikroORM);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		jest.useRealTimers();
		mockExit.mockRestore();
		await module.close();
	});

	describe('runLdapSync', () => {
		describe('when called with forceFullSync=true', () => {
			const setup = () => {
				const stats = { success: true, errors: [], systems: {} };
				mockRunLegacyLdapSync.mockResolvedValueOnce(stats);
				return { stats };
			};

			it('should call legacy LDAP sync with forceFullSync option', async () => {
				setup();

				const promise = uc.runLdapSync(true);
				jest.advanceTimersByTime(1000);
				await promise;

				expect(mockRunLegacyLdapSync).toHaveBeenCalledWith(orm, { forceFullSync: true });
			});

			it('should log sync start and completion', async () => {
				setup();

				const promise = uc.runLdapSync(true);
				jest.advanceTimersByTime(1000);
				await promise;

				expect(logger.info).toHaveBeenCalledTimes(3);
			});

			it('should schedule process exit', async () => {
				setup();

				const promise = uc.runLdapSync(true);
				jest.advanceTimersByTime(1000);
				await promise;

				expect(mockExit).toHaveBeenCalledWith(0);
			});
		});

		describe('when called with forceFullSync=false', () => {
			const setup = () => {
				const stats = { success: true, errors: [], systems: {} };
				mockRunLegacyLdapSync.mockResolvedValueOnce(stats);
				return { stats };
			};

			it('should call legacy LDAP sync with forceFullSync=false', async () => {
				setup();

				const promise = uc.runLdapSync(false);
				jest.advanceTimersByTime(1000);
				await promise;

				expect(mockRunLegacyLdapSync).toHaveBeenCalledWith(orm, { forceFullSync: false });
			});
		});
	});
});
