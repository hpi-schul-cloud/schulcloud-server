import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriter } from './console-writer.service';

describe('ConsoleWriter', () => {
	let service: ConsoleWriter;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ConsoleWriter],
		}).compile();

		service = module.get<ConsoleWriter>(ConsoleWriter);
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
