import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { TldrawDeleteFilesUc } from '../uc';
import { TldrawFilesConsole } from './tldraw-files.console';

describe('TldrawFilesConsole', () => {
	let console: TldrawFilesConsole;
	let deleteFilesUc: TldrawDeleteFilesUc;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TldrawFilesConsole,
				{
					provide: TldrawDeleteFilesUc,
					useValue: createMock<TldrawDeleteFilesUc>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(TldrawFilesConsole);
		deleteFilesUc = module.get(TldrawDeleteFilesUc);

		// Set fake system time. Otherwise, dates constructed in the test and the
		// console can differ because of the short time elapsing between the calls.
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2022, 1, 22));
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('deleteUnusedFiles', () => {
		it('should call UC with threshold date', async () => {
			const minimumFileAgeInHours = 1;
			const thresholdDate = new Date();
			thresholdDate.setHours(thresholdDate.getHours() - minimumFileAgeInHours);

			await console.deleteUnusedFiles(minimumFileAgeInHours);

			expect(deleteFilesUc.deleteUnusedFiles).toHaveBeenCalledWith(thresholdDate);
		});
	});
});
