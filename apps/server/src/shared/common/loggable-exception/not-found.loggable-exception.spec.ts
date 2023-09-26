import { NotFoundLoggableException } from './not-found.loggable-exception';

describe('NotFoundLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const resourceName = 'School';
			const identifierName = 'id';
			const resourceId = 'schoolId';

			const exception = new NotFoundLoggableException(resourceName, identifierName, resourceId);

			return {
				exception,
				resourceName,
				identifierName,
				resourceId,
			};
		};

		it('should log the correct message', () => {
			const { exception, resourceName, identifierName, resourceId } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'NOT_FOUND',
				stack: expect.any(String),
				data: {
					resourceName,
					[identifierName]: resourceId,
				},
			});
		});
	});
});
