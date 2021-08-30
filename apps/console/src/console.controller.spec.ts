import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';

describe('ConsoleController', () => {
	let consoleController: ConsoleController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [ConsoleController],
			providers: [ConsoleService],
		}).compile();

		consoleController = app.get<ConsoleController>(ConsoleController);
	});

	describe('root', () => {
		it('should return "Hello World!"', () => {
			expect(consoleController.getHello()).toBe('Hello World!');
		});
	});
});
