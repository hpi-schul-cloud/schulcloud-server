import { EventListenerMissingLoggable } from './event-listener-missing.loggable';

describe(EventListenerMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		it('should return the log message', () => {
			const eventName = 'test-event';

			const loggable: EventListenerMissingLoggable = new EventListenerMissingLoggable(eventName);

			expect(loggable.getLogMessage()).toEqual({
				type: 'EVENT_LISTENER_MISSING',
				message: 'There is no event listener available to handle this event',
				data: {
					eventName,
				},
			});
		});
	});
});
