import { BoardImportLinkInvalidLoggableException } from './board-import-link-invalid.loggable-exception';

describe(BoardImportLinkInvalidLoggableException.name, () => {
	const setup = () => {
		const exception = new BoardImportLinkInvalidLoggableException();

		return { exception };
	};

	it('should have the status 400', () => {
		const { exception } = setup();

		expect(exception.getStatus()).toEqual(400);
	});

	describe('getLogMessage', () => {
		it('should return the log message without the link', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({ type: exception.type, stack: exception.stack });
		});
	});
});
