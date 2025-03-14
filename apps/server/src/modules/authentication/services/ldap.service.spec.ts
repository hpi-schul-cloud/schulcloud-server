import { createMock } from '@golevelup/ts-jest';
import { System } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@core/logger';
import { LdapUserCouldNotBeAuthenticatedLoggableException } from '../loggable';
import { LdapService } from './ldap.service';

const mockClient = {
	connected: false,
	on(eventName: string, callback: () => unknown) {
		callback();
	},
	bind(username: string, password: string, callback: (error?: unknown) => unknown) {
		if (username === 'connectSucceeds') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			this.connected = true;
			callback();
		}
		if (username === 'connectWithoutFlag') {
			callback();
		}
		callback('an error');
	},
	unbind() {},
};

jest.mock('ldapjs', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const originalModule = jest.requireActual('ldapjs');

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {
		__esModule: true,
		...originalModule,
		createClient: () => {
			return { ...mockClient };
		},
	};
});

describe('LdapService', () => {
	let module: TestingModule;
	let ldapService: LdapService;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LdapService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		ldapService = module.get(LdapService);
	});

	describe('checkLdapCredentials', () => {
		describe('when credentials are correct', () => {
			it('should login successfully', async () => {
				const system: System = systemFactory.withLdapConfig().build();
				await expect(
					ldapService.checkLdapCredentials(system, 'connectSucceeds', 'mockPassword')
				).resolves.not.toThrow();
			});
		});

		describe('when no ldap config is provided', () => {
			it('should throw error', async () => {
				const system: System = systemFactory.build();
				await expect(ldapService.checkLdapCredentials(system, 'mockUsername', 'mockPassword')).rejects.toThrow(
					new Error(`no LDAP config found in system ${system.id}`)
				);
			});
		});

		describe('when user is not authorized', () => {
			it('should throw UserCouldNotAuthenticateLoggableException', async () => {
				const system: System = systemFactory.withLdapConfig().build();
				await expect(ldapService.checkLdapCredentials(system, 'mockUsername', 'mockPassword')).rejects.toThrow(
					LdapUserCouldNotBeAuthenticatedLoggableException
				);
			});
		});
	});
});
