import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { AbstractEvent } from './abstract-event';
import { AbstractEventListener } from './abstract-event-listener';
import { EventService } from './event.service';
import { EventListenerMissingLoggable, EventProcessingFailedLoggableException } from './loggable';

type ExampleContent = {
	message?: string;
	isError?: boolean;
};

class ExampleEvent extends AbstractEvent<ExampleContent> {
	payload: ExampleContent;

	constructor(payload: ExampleContent) {
		super();
		this.payload = payload;
	}

	getEventName(): string {
		return 'exampleEvent';
	}
}

class NopeEvent extends AbstractEvent<string> {
	payload: string;

	constructor(payload: string) {
		super();
		this.payload = payload;
	}

	getEventName(): string {
		return 'nopeEvent';
	}
}

class ExampleEventListener extends AbstractEventListener<ExampleEvent> {
	protected handled = false;

	// eslint-disable-next-line @typescript-eslint/require-await
	async handleEvent(event: ExampleEvent): Promise<void> {
		if (event.payload.isError) {
			throw new Error('error');
		}
		this.handled = true;
	}
}

describe(EventService.name, () => {
	let module: TestingModule;
	let service: EventService;
	let eventEmitter: DeepMocked<EventEmitter2>;
	let logger: DeepMocked<Logger>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				EventService,
				{
					provide: EventEmitter2,
					useValue: createMock<EventEmitter2>(new EventEmitter2()),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(EventService);
		eventEmitter = module.get(EventEmitter2);
		logger = module.get(Logger);
	});

	describe('emitEvent', () => {
		describe('when an event listener is registered', () => {
			it('should emit events', () => {
				const event: ExampleEvent = new ExampleEvent({});

				service.emitEvent(event);

				expect(eventEmitter.emit).toHaveBeenCalledWith(event.getEventName(), event);
			});
		});

		describe('when no event listener is registered', () => {
			const setup = () => {
				const event: NopeEvent = new NopeEvent('nope');
				eventEmitter.emit.mockReturnValue(false);

				return {
					event,
				};
			};

			it('should log a warning', () => {
				const { event } = setup();

				service.emitEvent(event);

				expect(logger.warning).toHaveBeenCalledWith(new EventListenerMissingLoggable(event.getEventName()));
			});
		});

		describe('when an event listener throws an error', () => {
			const setup = () => {
				const event: ExampleEvent = new ExampleEvent({ isError: true });
				const listener: ExampleEventListener = new ExampleEventListener();
				service.addEventListener(ExampleEvent, listener);

				return {
					event,
					listener,
				};
			};

			it('should log a warning', async () => {
				const { event } = setup();

				service.emitEvent(event);
				// eslint-disable-next-line no-promise-executor-return
				await new Promise((resolve) => setImmediate(resolve));

				expect(logger.warning).toHaveBeenCalledWith(
					new EventProcessingFailedLoggableException(event.getEventName(), new Error('error'))
				);
			});
		});
	});

	describe('addEventListener', () => {
		const setup = () => {
			const listener: ExampleEventListener = new ExampleEventListener();
			const exampleEvent: ExampleEvent = new ExampleEvent({ message: 'Hello, world!' });

			return {
				listener,
				exampleEvent,
			};
		};

		it('should add an event listener', () => {
			const { listener, exampleEvent } = setup();

			service.addEventListener(ExampleEvent, listener);

			expect(eventEmitter.on).toHaveBeenCalledWith(exampleEvent.getEventName(), expect.any(Function), {});
		});

		it('should add an event listener async', () => {
			const { listener, exampleEvent } = setup();

			service.addEventListener(ExampleEvent, listener, true);

			expect(eventEmitter.on).toHaveBeenCalledWith(exampleEvent.getEventName(), expect.any(Function), {
				async: true,
			});
		});
	});
});
