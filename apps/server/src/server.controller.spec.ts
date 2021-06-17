import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from './server.controller';

describe('ServerController', () => {
	let serverController: ServerController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [ServerController],
		}).compile();

		serverController = app.get<ServerController>(ServerController);
	});

	describe('root', () => {
		it('should return "Schulcloud Server API"', () => {
			expect(serverController.getHello()).toBe('Schulcloud Server API');
		});
	});
});
