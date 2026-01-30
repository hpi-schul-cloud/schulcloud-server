import util from 'util';
import { GenericFileStorageLoggable } from './generic-file-storage-adapter.loggable';

describe(GenericFileStorageLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = {
				error: 'invalid_request',
			};

			const loggable = new GenericFileStorageLoggable('message', { error: util.inspect(error) });

			return { loggable, error };
		};

		it('should return error log message', () => {
			const { loggable, error } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual({
				message: 'message',
				data: { error: util.inspect(error) },
			});
		});
	});
});
