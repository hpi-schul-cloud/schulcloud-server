import { boardImportJobFactory } from '../testing';
import { BoardImportJobEvent, BoardImportJobEventReason, BoardImportJobLoggable } from './board-import-job.loggable';

describe(BoardImportJobLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the loggable has all values', () => {
			const setup = () => {
				const { id, attempts } = boardImportJobFactory.build({ attempts: 2 });
				const event = BoardImportJobEvent.FAILED;
				const reason = BoardImportJobEventReason.MAX_ATTEMPTS;
				const loggable = new BoardImportJobLoggable(id, event, { reason, attempts });

				return { loggable, id, event, reason, attempts };
			};

			it('should return the job id, the event, the reason and the attempts', () => {
				const { loggable, id, event, reason, attempts } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					message: 'Board import job',
					data: { jobId: id, event, reason, attempts },
				});
			});
		});
	});
});
