import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriter } from './console-writer/console-writer.service';
import { ServerConsoleModule } from './server-console.module';
import { ServerConsole } from './server.console';

describe('ServerConsole', () => {
	let serverConsole: ServerConsole;
	let consoleWriter: ConsoleWriter;
	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			imports: [ServerConsoleModule],
		}).compile();

		serverConsole = app.get<ServerConsole>(ServerConsole);
		consoleWriter = app.get<ConsoleWriter>(ConsoleWriter);
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
