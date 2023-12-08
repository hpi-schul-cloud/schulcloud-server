import { AbstractEvent } from '../abstract-event';
import { EventReceivedLoggable } from './event-received.loggable';

class ExampleEvent extends AbstractEvent<string> {
	payload: string;

	constructor(payload: string) {
		super();
		this.payload = payload;
	}

	getEventName(): string {
		return 'exampleEvent';
	}
}

describe(EventReceivedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const event: ExampleEvent = new ExampleEvent('payload');
			const loggable = new EventReceivedLoggable(event.getEventName());
			return { event, loggable };
		};

		it('should return a log message', () => {
			const { loggable, event } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				type: 'EVENT_RECEIVED',
				message: 'Event received',
				data: {
					eventName: event.getEventName(),
				},
			});
		});
	});
});
