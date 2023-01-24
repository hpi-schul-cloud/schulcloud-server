import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { KeycloakManagementUc } from '../../uc/Keycloak-management.uc';
import { KeycloakConsole } from './keycloak-management.console';

describe('KeycloakConsole', () => {
	let module: TestingModule;
	let console: KeycloakConsole;
	let writer: DeepMocked<ConsoleWriterService>;
	let uc: DeepMocked<KeycloakManagementUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: KeycloakManagementUc,
					useValue: createMock<KeycloakManagementUc>(),
				},
			],
		}).compile();

		writer = module.get(ConsoleWriterService);
		uc = module.get(KeycloakManagementUc);
		console = new KeycloakConsole(writer, uc);
	});

	afterAll(async () => {
		await module.close();
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
			await expect(console.clean({ retryCount: 1, retryDelay: 0 })).resolves.not.toThrow();
		});
		it('should retry and resolve successfully', async () => {
			jest.spyOn(uc, 'clean').mockRejectedValueOnce('error');
			jest.spyOn(uc, 'clean').mockResolvedValue(0);
			await expect(console.clean({ retryCount: 2, retryDelay: 0 })).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'clean').mockRejectedValue('');
			await expect(console.clean({ retryCount: 1, retryDelay: 0 })).rejects.toThrow();
		});
		it('should retry but throw error after last attempt', async () => {
			jest.spyOn(uc, 'clean').mockRejectedValue('');
			await expect(console.clean({ retryCount: 2, retryDelay: 0 })).rejects.toThrow();
		});
	});

	describe('seed', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'seed').mockResolvedValue(0);
			await expect(console.seed({ retryCount: 1, retryDelay: 10 })).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'seed').mockRejectedValue('');
			await expect(console.seed({ retryCount: 1, retryDelay: 10 })).rejects.toThrow();
		});
	});

	describe('configure', () => {
		it('should resolve successfully', async () => {
			uc.configure.mockResolvedValue(1);

			await expect(
				console.configure({
					retryCount: 1,
					retryDelay: 10,
				})
			).resolves.not.toThrow();

			uc.configure.mockRestore();
		});
		it('should throw on error', async () => {
			uc.configure.mockRejectedValue('configure failed');

			await expect(
				console.configure({
					retryCount: 1,
					retryDelay: 10,
				})
			).rejects.toThrow();

			uc.configure.mockRestore();
		});
	});
});
