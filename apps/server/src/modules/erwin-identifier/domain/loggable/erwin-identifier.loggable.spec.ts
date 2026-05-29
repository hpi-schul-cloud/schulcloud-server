import { ErwinIdentifierLoggable } from './erwin-identifier.loggable';

describe(ErwinIdentifierLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when a erwinIdentifier message is provided', () => {
			const setup = () => {
				const message = 'ErwinId created successfully';
				const loggable = new ErwinIdentifierLoggable(message);

				return { message, loggable };
			};

			it('should return the correct log message', () => {
				const { message, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual({
					type: 'ERWIN_IDENTIFIER_LOGGABLE',
					message,
				});
			});
		});
	});
});
