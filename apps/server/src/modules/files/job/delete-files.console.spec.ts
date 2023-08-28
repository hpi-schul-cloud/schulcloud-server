import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { DeleteFilesUC } from '../uc';
import { DeleteFilesConsole } from './delete-files.console';

describe('DeleteFilesConsole', () => {
	let console: DeleteFilesConsole;
	let deleteFilesUc: DeleteFilesUC;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DeleteFilesConsole],
			providers: [
				{
					provide: DeleteFilesUC,
					useValue: createMock<DeleteFilesUC>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(DeleteFilesConsole);
		deleteFilesUc = module.get(DeleteFilesUC);

		// Set fake system time. Otherwise, dates constructed in the test and the
		// console can differ because of the short time elapsing between the calls.
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2022, 1, 22));
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('deleteMarkedFiles', () => {
		it('should call UC with threshold date and batch size', async () => {
			const daysSinceDeletion = 7;
			const batchSize = 3;
			const thresholdDate = new Date();
			thresholdDate.setDate(thresholdDate.getDate() - daysSinceDeletion);

			await console.deleteMarkedFiles(daysSinceDeletion, batchSize);

			expect(deleteFilesUc.deleteMarkedFiles).toHaveBeenCalledWith(thresholdDate, batchSize);
		});
	});
});
