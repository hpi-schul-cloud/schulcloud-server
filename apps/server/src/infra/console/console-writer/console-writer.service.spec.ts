import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from './console-writer.service';

describe('ConsoleWriterService', () => {
	let module: TestingModule;
	let service: ConsoleWriterService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ConsoleWriterService],
		}).compile();

		service = module.get(ConsoleWriterService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
