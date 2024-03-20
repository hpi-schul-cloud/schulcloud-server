import { WsSharedDocErrorLoggable } from './ws-shared-doc-error.loggable';

describe('WsSharedDocErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const docName = 'docname';
			const message = 'error message';
			const error = new Error('test');
			const loggable = new WsSharedDocErrorLoggable(docName, message, error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error in document docname: error message',
				type: 'WSSHAREDDOC_ERROR',
				error,
			});
		});
	});
});
