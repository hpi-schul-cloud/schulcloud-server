import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from 'nestjs-console';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DeleteFilesController } from './delete-files.controller';
import { DeleteFilesUc } from '../uc';
import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFilesController', () => {
	let controller: DeleteFilesController;
	let deleteFilesUc: DeleteFilesUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ConsoleModule, LoggerModule],
			controllers: [DeleteFilesController],
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

		controller = module.get<DeleteFilesController>(DeleteFilesController);
		deleteFilesUc = module.get<DeleteFilesUc>(DeleteFilesUc);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should call removeDeletedFilesData use case with removedSince date', async () => {
			const removedSinceDays = 7;
			const deleteFilesUcSpy = jest.spyOn(deleteFilesUc, 'removeDeletedFilesData');
			await controller.removeDeletedFilesData(7);
			expect(deleteFilesUcSpy).toHaveBeenCalledTimes(1);
			const useCaseArg = deleteFilesUcSpy.mock.calls[0][0];
			const dateDifferenceInDays = new Date(new Date().getTime() - useCaseArg.getTime()).getDate() - 1;
			expect(dateDifferenceInDays).toEqual(removedSinceDays);
		});
	});
});
