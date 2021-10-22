import * as moment from 'moment';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DeleteFilesConsole } from './delete-files.console';
import { DeleteFilesUc } from '../uc';
import { FilesRepo } from '../repo';

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
					provide: FileStorageAdapter,
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
			await console.removeDeletedFilesData(removedSinceDays);
			expect(deleteFilesUcSpy).toHaveBeenCalledTimes(1);
			const useCaseArg = deleteFilesUcSpy.mock.calls[0][0];
			const timeDifference = moment.duration(new Date().getTime() - useCaseArg.getTime());
			expect(timeDifference.asDays()).toBeCloseTo(removedSinceDays);
		});
	});
});
