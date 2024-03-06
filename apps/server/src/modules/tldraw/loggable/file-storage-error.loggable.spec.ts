import { FileStorageErrorLoggable } from './file-storage-error.loggable';

describe('FileStorageErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const loggable = new FileStorageErrorLoggable('doc1', error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error in document doc1: assets could not be synchronized with file storage.',
				type: 'FILE_STORAGE_GENERAL_ERROR',
				error,
			});
		});
	});
});
