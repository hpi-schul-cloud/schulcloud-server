import { UserImportFetchingFailureLoggableException } from './user-import-fetching-failure-loggable-exception';

describe(UserImportFetchingFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const url = 'mockUrl';
			const loggable = new UserImportFetchingFailureLoggableException(url);

			return { loggable, url };
		};

		it('should return a loggable message', () => {
			const { loggable, url } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_FETCHING_FAILURE',
				message: 'While fetching import users an error occurred.',
				stack: loggable.stack,
				data: {
					url,
				},
			});
		});
	});
});
