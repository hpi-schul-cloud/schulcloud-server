import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@src/core/logger';
import { AbstractEvent } from './abstract-event';
import { AbstractEventListener } from './abstract-event-listener';
import { EventListenerMissingLoggable, EventProcessingFailedLoggableException } from './loggable';

@Injectable()
export class EventService {
	constructor(private readonly eventEmitter: EventEmitter2, private readonly logger: Logger) {}

	public emitEvent<T>(event: AbstractEvent<T>): void {
		const emitted: boolean = this.eventEmitter.emit(event.getEventName(), event);
		if (!emitted) {
			this.logger.warning(new EventListenerMissingLoggable(event.getEventName()));
		}
	}

	public addEventListener<T>(
		EventType: new (payload: T) => AbstractEvent<T>,
		listener: AbstractEventListener<AbstractEvent<T>>,
		asyncHandler?: boolean
	): void {
		const eventName: string = new EventType({} as T).getEventName();

		this.eventEmitter.on(
			eventName,
			(event: AbstractEvent<T>): void => {
				listener.handleEvent(event).catch((error: Error) => {
					this.logger.warning(new EventProcessingFailedLoggableException(event.getEventName(), error));
				});
			},
			{ async: asyncHandler }
		);
	}
}
