import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { KeycloakConsole } from './keycloak-management.console';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

describe('KeycloakConsole', () => {
	let module: TestingModule;
	let console: KeycloakConsole;
	let writer: ConsoleWriterService;
	let uc: KeycloakManagementUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ConsoleWriterService,
					useValue: {
						info: jest.fn(),
					},
				},
				{
					provide: KeycloakManagementUc,
					useValue: {
						check: jest.fn(),
						clean: jest.fn(),
						seed: jest.fn(),
					},
				},
			],
		}).compile();

		writer = module.get(ConsoleWriterService);
		uc = module.get(KeycloakManagementUc);
		console = new KeycloakConsole(writer, uc);
	});

	describe('check', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'check').mockResolvedValue(true);
			await expect(console.check()).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'check').mockResolvedValue(false);
			await expect(console.check()).rejects.toThrow();
		});
	});

	describe('clean', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'clean').mockResolvedValue(0);
			await expect(console.clean()).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'clean').mockRejectedValue('');
			await expect(console.clean()).rejects.toThrow();
		});
	});

	describe('seed', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'seed').mockResolvedValue(0);
			await expect(console.seed()).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'seed').mockRejectedValue('');
			await expect(console.seed()).rejects.toThrow();
		});
	});
});
