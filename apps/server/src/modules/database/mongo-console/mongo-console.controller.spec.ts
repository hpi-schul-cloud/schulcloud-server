import { Test, TestingModule } from '@nestjs/testing';
import { MongoConsoleController } from './mongo-console.controller';

describe('MongoConsoleController', () => {
	let controller: MongoConsoleController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MongoConsoleController],
		}).compile();

		controller = module.get<MongoConsoleController>(MongoConsoleController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
