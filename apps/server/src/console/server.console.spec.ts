import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { ServerConsoleModule } from './console.module';
import { ServerConsole } from './server.console';

describe('ServerConsole', () => {
	let serverConsole: ServerConsole;
	let consoleWriter: ConsoleWriterService;
	let module: TestingModule;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerConsoleModule],
		}).compile();

		serverConsole = module.get<ServerConsole>(ServerConsole);
		consoleWriter = module.get<ConsoleWriterService>(ConsoleWriterService);
	});
	afterAll(async () => {
		await module.close();
	});

	describe('root', () => {
		it('should spin "Schulcloud Server API"', () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			serverConsole.getHello();
			expect(consoleInfoSpy).toHaveBeenCalledWith('Schulcloud Server API');
			consoleInfoSpy.mockReset();
		});
		it('should spin input as output', () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			serverConsole.getInOut('sample');
			expect(consoleInfoSpy).toHaveBeenCalledWith('input was: sample');
			consoleInfoSpy.mockReset();
		});
	});
});
