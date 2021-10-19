import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from './console-writer.service';

describe('ConsoleWriterModule', () => {
	let module: TestingModule;
	let service: ConsoleWriterService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConsoleWriterService],
		}).compile();
		service = module.get<ConsoleWriterService>(ConsoleWriterService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service', () => {
		expect(service).toBeDefined();
	});
});
