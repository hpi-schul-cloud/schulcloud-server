import { createMock } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { systemFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { LdapService } from './ldap.service';

const mockClient = {
	connected: false,
	on(eventName: string, callback: () => unknown) {
		callback();
	},
	bind(username, password, callback: (error?: unknown) => unknown) {
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
		createClient: () => ({ ...mockClient }),
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

	describe('authenticate', () => {
		it('should throw error if no ldapconfig is given', async () => {
			const system: System = systemFactory.buildWithId();
			await expect(ldapService.authenticate(system, 'mockUsername', 'mockPassword')).rejects.toThrow(
				new Error(`no LDAP config found in system ${system.id}`)
			);
		});

		it('should throw error if user cannot be authorised', async () => {
			const system: System = systemFactory.withLdapConfig().buildWithId();
			await expect(ldapService.authenticate(system, 'mockUsername', 'mockPassword')).rejects.toThrow(
				new UnauthorizedException('User could not authenticate')
			);
		});

		it('should throw error if connected flag is not set', async () => {
			const system: System = systemFactory.withLdapConfig().buildWithId();
			await expect(ldapService.authenticate(system, 'connectWithoutFlag', 'mockPassword')).rejects.toThrow(
				new UnauthorizedException('User could not authenticate')
			);
		});

		it('should login successfully', async () => {
			const system: System = systemFactory.withLdapConfig().buildWithId();
			const connected = await ldapService.authenticate(system, 'connectSucceeds', 'mockPassword');
			expect(connected).toBe(true);
		});
	});
});
