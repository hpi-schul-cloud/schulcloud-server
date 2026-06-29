import { GenericFileStorageLoggable } from './generic-file-storage-adapter.loggable';

describe(GenericFileStorageLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = {
				error: 'invalid_request',
			};

			const loggable = new GenericFileStorageLoggable('message', error, { additional: 'data' });

			return { loggable, error };
		};

		it('should return error log message', () => {
			const { loggable, error } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual({
				message: 'message',
				data: { additional: 'data' },
			});
		});
	});
});
