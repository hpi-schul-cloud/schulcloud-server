import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from './console-writer.service';

describe('ConsoleWriterService', () => {
	let service: ConsoleWriterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ConsoleWriterService],
		}).compile();

		service = module.get<ConsoleWriterService>(ConsoleWriterService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
	describe('when using info on console writer', () => {
		it('should call spinner info with same input text', () => {
			// eslint-disable-next-line @typescript-eslint/dot-notation
			const spinnerSpy = jest.spyOn(service['spinner'], 'info');
			const someRandomText = 'random text';
			service.info(someRandomText);
			expect(spinnerSpy).toHaveBeenCalledWith(someRandomText);
			spinnerSpy.mockReset();
		});
	});
});
