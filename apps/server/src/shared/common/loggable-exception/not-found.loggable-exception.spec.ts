import { NotFoundLoggableException } from './not-found.loggable-exception';

describe('NotFoundLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const resourceName = 'School';
			const identifiers: Record<string, string> = {
				id1: 'testId1',
				id2: 'testId2',
			};

			const exception = new NotFoundLoggableException(resourceName, identifiers);

			return {
				exception,
				resourceName,
				identifiers,
			};
		};

		it('should log the correct message', () => {
			const { exception, resourceName, identifiers } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'NOT_FOUND',
				stack: expect.any(String),
				data: {
					resourceName,
					...identifiers,
				},
			});
		});
	});
});
