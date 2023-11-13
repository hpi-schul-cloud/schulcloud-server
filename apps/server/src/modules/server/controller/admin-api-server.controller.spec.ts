import { Test, TestingModule } from '@nestjs/testing';
import { AdminApiServerController } from './admin-api-server.controller';

describe('AdminApiServerController', () => {
	let module: TestingModule;
	let serverController: AdminApiServerController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [AdminApiServerController],
		}).compile();

		serverController = module.get(AdminApiServerController);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('root', () => {
		it('should return "Admin Server API"', () => {
			expect(serverController.getHello()).toBe('Admin Server API');
		});
	});
});
