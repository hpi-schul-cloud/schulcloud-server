import { Test, TestingModule } from '@nestjs/testing';
import { ServerConsole } from './server.console';
import { ServerModule } from './server.module';

describe('ServerConsole', () => {
	let serverConsole: ServerConsole;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
		}).compile();

		serverConsole = app.get<ServerConsole>(ServerConsole);
	});

	describe('root', () => {
		it('should spin "Schulcloud Server API"', () => {
			const spinnerSpy = jest.spyOn(serverConsole.spinner, 'info');
			serverConsole.getHello();
			expect(spinnerSpy).toHaveBeenCalledWith('Schulcloud Server API');
			spinnerSpy.mockReset();
		});
		it('should spin input as output', () => {
			const spinnerSpy = jest.spyOn(serverConsole.spinner, 'info');
			serverConsole.getInOut('sample');
			expect(spinnerSpy).toHaveBeenCalledWith('input was: sample');
			spinnerSpy.mockReset();
		});
	});
});
