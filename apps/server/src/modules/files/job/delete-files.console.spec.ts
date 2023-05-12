import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { DeleteFilesUc } from '../uc';
import { DeleteFilesConsole } from './delete-files.console';

describe('DeleteFilesConsole', () => {
	let console: DeleteFilesConsole;
	let deleteFilesUc: DeleteFilesUc;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DeleteFilesConsole],
			providers: [
				{
					provide: DeleteFilesUc,
					useValue: createMock<DeleteFilesUc>(),
				},
				{
					provide: FilesRepo,
					useValue: {},
				},
				{
					provide: FileStorageAdapter,
					useValue: {},
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(DeleteFilesConsole);
		deleteFilesUc = module.get(DeleteFilesUc);

		// Set fake system time. Otherwise dates constructed in the test and the console can differ because of the short time elapsing between the calls.
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2022, 1, 22));
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('deleteMarkedFiles', () => {
		it('should call UC with deletedSince date and batchSize', async () => {
			const daysSinceDeletion = 7;
			const batchSize = 3;
			const deletedSince = new Date();
			deletedSince.setDate(deletedSince.getDate() - daysSinceDeletion);

			await console.deleteMarkedFiles(daysSinceDeletion, batchSize);

			expect(deleteFilesUc.deleteMarkedFiles).toHaveBeenCalledWith(deletedSince, batchSize);
		});
	});
});
