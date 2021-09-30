import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriter } from './console-writer.service';

describe('FileSystemModule', () => {
	let module: TestingModule;
	let service: ConsoleWriter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConsoleWriter],
		}).compile();
		service = module.get<ConsoleWriter>(ConsoleWriter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service', () => {
		expect(service).toBeDefined();
	});
});
