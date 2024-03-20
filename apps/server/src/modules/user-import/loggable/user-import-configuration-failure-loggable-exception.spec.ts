import { UserImportConfigurationFailureLoggableException } from './user-import-configuration-failure-loggable-exception';

describe(UserImportConfigurationFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new UserImportConfigurationFailureLoggableException();

			return { loggable };
		};

		it('should return a loggable message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_CONFIGURATION_FAILURE',
				message: 'Please check the user import configuration.',
				stack: loggable.stack,
			});
		});
	});
});
