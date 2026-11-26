import { BoardImportSourceType } from '../type';
import { BoardImportSourceDisabledLoggableException } from './board-import-source-disabled.loggable-exception';

describe(BoardImportSourceDisabledLoggableException.name, () => {
	const setup = () => {
		const sourceType = BoardImportSourceType.TASKCARDS;
		const exception = new BoardImportSourceDisabledLoggableException(sourceType);

		return { exception, sourceType };
	};

	it('should have the status 403', () => {
		const { exception } = setup();

		expect(exception.getStatus()).toEqual(403);
	});

	describe('getLogMessage', () => {
		it('should return the log message without the link', () => {
			const { exception, sourceType } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({ type: exception.type, stack: exception.stack, data: { sourceType } });
		});
	});
});
