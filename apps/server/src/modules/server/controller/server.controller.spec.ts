import { Test, TestingModule } from '@nestjs/testing';

describe('ServerController', () => {
	let module: TestingModule;
	let serverController: ServerController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [ServerController],
		}).compile();

		serverController = module.get(ServerController);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('root', () => {
		it('should return "Schulcloud Server API"', () => {
			expect(serverController.getHello()).toBe('Schulcloud Server API');
		});
	});
});
