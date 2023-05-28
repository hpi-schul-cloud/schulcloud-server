import { LoggableMessage } from './loggable-message';

describe('LoggableMessage', () => {
	describe('getLogMessage', () => {
		it('should return loggable message with given content', () => {
			const testMessage = "this is some test message I'd like to log";
			const testLoggableMessage = new LoggableMessage(testMessage).getLogMessage();

			expect(testLoggableMessage).toHaveProperty('message', testMessage);
		});
	});
});
