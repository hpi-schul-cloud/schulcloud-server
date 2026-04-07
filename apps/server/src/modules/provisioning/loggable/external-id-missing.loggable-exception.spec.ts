import { ExternalIdMissingLoggableException } from './external-id-missing.loggable-exception';

describe(ExternalIdMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		describe('when called with fieldName only', () => {
			const setup = () => {
				const fieldName = 'ExternalSchoolDto.externalId';

				const loggable = new ExternalIdMissingLoggableException(fieldName);

				return {
					loggable,
					fieldName,
				};
			};

			it('should return a loggable message', () => {
				const { loggable, fieldName } = setup();

				const message = loggable.getLogMessage();

				expect(message).toEqual({
					type: 'EXTERNAL_ID_MISSING',
					message: `External ID is missing for field: ${fieldName}`,
					stack: expect.any(String),
					data: {
						fieldName,
					},
				});
			});
		});

		describe('when called with fieldName and additionalInfo', () => {
			const setup = () => {
				const fieldName = 'ExternalSchoolDto.externalId';
				const additionalInfo = { erwinId: 'some-erwin-id' };

				const loggable = new ExternalIdMissingLoggableException(fieldName, additionalInfo);

				return {
					loggable,
					fieldName,
					additionalInfo,
				};
			};

			it('should return a loggable message with additional info', () => {
				const { loggable, fieldName, additionalInfo } = setup();

				const message = loggable.getLogMessage();

				expect(message).toEqual({
					type: 'EXTERNAL_ID_MISSING',
					message: `External ID is missing for field: ${fieldName}`,
					stack: expect.any(String),
					data: {
						fieldName,
						...additionalInfo,
					},
				});
			});
		});
	});
});
