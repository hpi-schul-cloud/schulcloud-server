import { InvalidBoardImportJobMessageLoggable } from './invalid-board-import-job-message.loggable';

describe(InvalidBoardImportJobMessageLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the loggable is created', () => {
			const setup = () => {
				const loggable = new InvalidBoardImportJobMessageLoggable();

				return { loggable };
			};

			it('should return a message without data', () => {
				const { loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({ message: 'Board import job message without job id was dropped' });
			});
		});
	});
});
