import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import moment from 'moment';
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
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(DeleteFilesConsole);
		deleteFilesUc = module.get(DeleteFilesUc);
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
			expect(timeDifference.asDays()).toBeCloseTo(removedSinceDays, 1); // TODO fails without 1 when timezone changed
		});
	});
});
