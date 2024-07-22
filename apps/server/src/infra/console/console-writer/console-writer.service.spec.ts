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

	it('should log info', () => {
		const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
		service.info('test');
		expect(spy).toHaveBeenCalledWith('Info:', 'test');
	});

	it('should log error', () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		service.error('test');
		expect(spy).toHaveBeenCalledWith('Error:', 'test');
	});
});
