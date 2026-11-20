import { boardImportJobFactory } from '../testing';
import { BoardImportSource } from '../domain';
import { BoardImportJobLoggable, BoardImportStep, BoardImportStepResult } from './board-import-job.loggable';

describe(BoardImportJobLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const job = boardImportJobFactory.build();
			const info = {
				jobId: job.id,
				source: BoardImportSource.TASKCARDS,
				step: BoardImportStep.PROCESS_JOB,
				result: BoardImportStepResult.SUCCESS,
			};
			const loggable = new BoardImportJobLoggable(info);

			return { loggable, info };
		};

		it('should return only the fixed fields', () => {
			const { loggable, info } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Board import job step',
				data: info,
			});
		});
	});
});
