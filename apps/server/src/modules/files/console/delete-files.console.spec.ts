import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DeleteFilesConsole } from './delete-files.console';
import { DeleteFilesUc } from '../uc';
import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFilesController', () => {
	let console: DeleteFilesConsole;
	let deleteFilesUc: DeleteFilesUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule],
			controllers: [DeleteFilesConsole],
			providers: [
				{
					provide: DeleteFilesUc,
					useValue: {
						removeDeletedFilesData: jest.fn,
					},
				},
				{
					provide: FilesRepo,
					useValue: {},
				},
				{
					provide: FileStorageRepo,
					useValue: {},
				},
			],
		}).compile();

		console = module.get<DeleteFilesConsole>(DeleteFilesConsole);
		deleteFilesUc = module.get<DeleteFilesUc>(DeleteFilesUc);
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should call removeDeletedFilesData use case with removedSince date', async () => {
			const removedSinceDays = 7;
			const deleteFilesUcSpy = jest.spyOn(deleteFilesUc, 'removeDeletedFilesData');
			await console.removeDeletedFilesData(7);
			expect(deleteFilesUcSpy).toHaveBeenCalledTimes(1);
			const useCaseArg = deleteFilesUcSpy.mock.calls[0][0];
			const dateDifferenceInDays = new Date(new Date().getTime() - useCaseArg.getTime()).getDate() - 1;
			expect(dateDifferenceInDays).toEqual(removedSinceDays);
		});
	});
});
