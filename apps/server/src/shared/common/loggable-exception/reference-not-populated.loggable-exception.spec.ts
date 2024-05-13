import { ReferenceNotPopulatedLoggableException } from './reference-not-populated.loggable-exception';

describe(ReferenceNotPopulatedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const entityName = 'someEntityName';
			const referenceName = 'someReferenceName';

			const exception = new ReferenceNotPopulatedLoggableException(entityName, referenceName);

			return {
				exception,
				entityName,
				referenceName,
			};
		};

		it('should log the correct message', () => {
			const { exception, entityName, referenceName } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'REFERENCE_NOT_POPULATED',
				stack: expect.any(String),
				data: {
					entityName,
					referenceName,
				},
			});
		});
	});
});
