import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { Logger } from '@src/core/logger';
import { LdapSyncConsole } from './ldap-sync.console';

describe('LdapSyncConsole', () => {
	let ldapSyncConsole: LdapSyncConsole;
	let module: TestingModule;
	let feathersLdapService;

	beforeAll(async () => {
		feathersLdapService = {
			find: jest.fn(() => Promise.resolve()),
		};
		module = await Test.createTestingModule({
			providers: [
				LdapSyncConsole,
				{
					provide: FeathersServiceProvider,
					useValue: {
						getService(name) {
							if (name === '/sync') {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
								return feathersLdapService;
							}
							return {};
						},
					},
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		ldapSyncConsole = await module.resolve<LdapSyncConsole>(LdapSyncConsole);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(ldapSyncConsole).toBeDefined();
	});

	describe('fullLdapSync', () => {
		it('should return resolved promise', async () => {
			await ldapSyncConsole.fullLdapSync();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(feathersLdapService.find).toBeCalled();
		});
	});
});
