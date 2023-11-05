import { UnknownQueryTypeLoggableException } from './unknown-query-type-loggable-exception';

describe('UnknownQueryTypeLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const unknownQueryType = 'unknwon';

			const exception = new UnknownQueryTypeLoggableException(unknownQueryType);

			return {
				exception,
				unknownQueryType,
			};
		};

		it('should log the correct message', () => {
			const { exception, unknownQueryType } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'INTERNAL_SERVER_ERROR',
				stack: expect.any(String),
				message: 'Unable to process unknown query type for class years.',
				data: {
					unknownQueryType,
				},
			});
		});
	});
});
