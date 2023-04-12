import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { Logger } from '@src/core/logger';
import { KeycloakConfigurationUc } from '../uc/keycloak-configuration.uc';
import { KeycloakConsole } from './keycloak-configuration.console';

describe('KeycloakConsole', () => {
	let module: TestingModule;
	let console: KeycloakConsole;
	let writer: DeepMocked<ConsoleWriterService>;
	let uc: DeepMocked<KeycloakConfigurationUc>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: KeycloakConfigurationUc,
					useValue: createMock<KeycloakConfigurationUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		writer = module.get(ConsoleWriterService);
		uc = module.get(KeycloakConfigurationUc);
		logger = module.get(Logger);
		console = new KeycloakConsole(writer, uc, logger);
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
			jest.spyOn(uc, 'clean').mockRejectedValue(new Error());
			await expect(console.clean({ retryCount: 1, retryDelay: 0 })).rejects.toThrow();
		});
		it('should retry but throw error after last attempt', async () => {
			jest.spyOn(uc, 'clean').mockRejectedValue(new Error());
			await expect(console.clean({ retryCount: 2, retryDelay: 0 })).rejects.toThrow();
		});
	});

	describe('seed', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'seed').mockResolvedValue(0);
			await expect(console.seed({ retryCount: 1, retryDelay: 10 })).resolves.not.toThrow();
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'seed').mockRejectedValue(new Error());
			await expect(console.seed({ retryCount: 1, retryDelay: 10 })).rejects.toThrow();
		});
	});

	describe('migrate', () => {
		it('should resolve successfully', async () => {
			jest.spyOn(uc, 'migrate').mockResolvedValue(1);
			await expect(console.migrate({ retryCount: 1, retryDelay: 10 })).resolves.not.toThrow();
		});
		it('should forward the skip option', async () => {
			const migrateSpy = jest.spyOn(uc, 'migrate');
			migrateSpy.mockClear();
			migrateSpy.mockResolvedValue(1);
			const skipValue = 10;
			await console.migrate({ skip: skipValue });
			expect(migrateSpy).toHaveBeenCalledWith(skipValue, expect.anything());
		});
		it('should forward the verbose option', async () => {
			const migrateSpy = jest.spyOn(uc, 'migrate');
			migrateSpy.mockClear();
			migrateSpy.mockResolvedValue(1);
			const verboseValue = true;
			await console.migrate({ verbose: verboseValue });
			expect(migrateSpy).toHaveBeenCalledWith(expect.anything(), verboseValue);
		});
		it('should throw on error', async () => {
			jest.spyOn(uc, 'migrate').mockRejectedValue(new Error());
			await expect(console.migrate({})).rejects.toThrow();
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
		it('should throw an instance of error object', async () => {
			const expectedError = new Error('test error');
			uc.configure.mockRejectedValue(expectedError);

			await expect(
				console.configure({
					retryCount: 1,
					retryDelay: 10,
				})
			).rejects.toThrow(expectedError);

			uc.configure.mockRestore();
		});

		it('should not throw an instance of error object', async () => {
			const mockedError = {
				name: 'test error',
			};

			const expectedError = JSON.stringify(mockedError);
			uc.configure.mockRejectedValue(mockedError);

			await expect(
				console.configure({
					retryCount: 1,
					retryDelay: 10,
				})
			).rejects.toThrow(expectedError);

			uc.configure.mockRestore();
		});
	});
});
