import { UserImportPopulateFailureLoggableException } from './user-import-populate-failure-loggable-exception';

describe(UserImportPopulateFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const url = 'mockUrl';
			const loggable = new UserImportPopulateFailureLoggableException(url);

			return { loggable, url };
		};

		it('should return a loggable message', () => {
			const { loggable, url } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_POPULATE_FAILURE',
				message: 'While populate import users an error occurred.',
				stack: loggable.stack,
				data: {
					url,
				},
			});
		});
	});
});
