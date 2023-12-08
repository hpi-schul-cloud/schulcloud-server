import { AbstractEvent } from '../abstract-event';
import { EventProcessingFailedLoggableException } from './event-processing-failed-loggable.exception';

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

describe(EventProcessingFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const event: ExampleEvent = new ExampleEvent('payload');
			const error: Error = new Error('error');
			const loggable = new EventProcessingFailedLoggableException(event.getEventName(), error);
			return { event, loggable, error };
		};

		it('should return a log message', () => {
			const { loggable, event, error } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				type: 'EVENT_PROCESSING_FAILURE',
				message: 'Event processing failed',
				stack: error.stack,
				data: {
					eventName: event.getEventName(),
				},
			});
		});
	});
});
