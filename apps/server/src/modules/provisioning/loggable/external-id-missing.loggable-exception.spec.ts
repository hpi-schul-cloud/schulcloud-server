import { ExternalIdMissingLoggableException } from './external-id-missing.loggable-exception';

describe(ExternalIdMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		describe('when called with context only', () => {
			const setup = () => {
				const context = 'ExternalSchoolDto';

				const loggable = new ExternalIdMissingLoggableException(context);

				return {
					loggable,
					context,
				};
			};

			it('should return a loggable message', () => {
				const { loggable, context } = setup();

				const message = loggable.getLogMessage();

				expect(message).toEqual({
					type: 'EXTERNAL_ID_MISSING',
					message: `External ID is missing in ${context}`,
					stack: expect.any(String),
					data: {
						context,
					},
				});
			});
		});

		describe('when called with context and additionalInfo', () => {
			const setup = () => {
				const context = 'ExternalSchoolDto';
				const additionalInfo = { erwinId: 'some-erwin-id' };

				const loggable = new ExternalIdMissingLoggableException(context, additionalInfo);

				return {
					loggable,
					context,
					additionalInfo,
				};
			};

			it('should return a loggable message with additional info', () => {
				const { loggable, context, additionalInfo } = setup();

				const message = loggable.getLogMessage();

				expect(message).toEqual({
					type: 'EXTERNAL_ID_MISSING',
					message: `External ID is missing in ${context}`,
					stack: expect.any(String),
					data: {
						context,
						...additionalInfo,
					},
				});
			});
		});
	});
});
