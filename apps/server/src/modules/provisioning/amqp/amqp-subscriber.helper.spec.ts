import { AmqpConnection, defaultNackErrorHandler } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Channel, ConsumeMessage } from 'amqplib';
import { registerAmqpSubscriber } from './amqp-subscriber.helper';

jest.mock('@golevelup/nestjs-rabbitmq', () => {
	const actualModule = jest.requireActual<typeof import('@golevelup/nestjs-rabbitmq')>('@golevelup/nestjs-rabbitmq');

	return {
		...actualModule,
		defaultNackErrorHandler: jest.fn(),
	};
});

const mockDefaultNackErrorHandler = jest.mocked(defaultNackErrorHandler);

interface TestPayload {
	value: string;
}

describe('registerAmqpSubscriber', () => {
	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeEach(() => {
		amqpConnection = createMock<AmqpConnection>();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when registering a subscriber', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const handler = jest.fn().mockResolvedValue(undefined);
			const logger = createMock<Logger>();

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				logger,
			};
		};

		it('should call createSubscriber with the correct parameters', async () => {
			const { exchangeName, event, subscriberName, handler, logger } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			expect(amqpConnection.createSubscriber).toHaveBeenCalledWith(
				expect.any(Function),
				{
					exchange: exchangeName,
					routingKey: event,
					queue: event,
					errorHandler: expect.any(Function),
				},
				subscriberName
			);
		});
	});

	describe('when the handler throws an error', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const error = new Error('Handler error');
			const handler = jest.fn().mockRejectedValue(error);
			const payload: TestPayload = { value: 'test-value' };
			const logger = createMock<Logger>();

			let subscriberCallback: (payload: TestPayload) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((callback: any) => {
				subscriberCallback = callback;

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				payload,
				getSubscriberCallback: () => subscriberCallback,
				logger,
				error,
			};
		};

		it('should log the error', async () => {
			const { exchangeName, event, subscriberName, handler, payload, getSubscriberCallback, logger } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const subscriberCallback = getSubscriberCallback();
			await subscriberCallback(payload);

			expect(logger.warning).toHaveBeenCalled();
		});
	});

	describe('when the errorHandler is called', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const handler = jest.fn().mockResolvedValue(undefined);
			const logger = createMock<Logger>();
			const channel = createMock<Channel>();
			const msg = createMock<ConsumeMessage>();
			const error = new Error('Test error');

			let errorHandler: (channel: Channel, msg: ConsumeMessage, error: unknown) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((_callback: any, options: any) => {
				({ errorHandler } = options);

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				logger,
				channel,
				msg,
				error,
				getErrorHandler: () => errorHandler,
			};
		};

		it('should log the error', async () => {
			const { exchangeName, event, subscriberName, handler, logger, channel, msg, error, getErrorHandler } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const errorHandler = getErrorHandler();
			await errorHandler(channel, msg, error);

			expect(logger.warning).toHaveBeenCalled();
		});

		it('should call defaultNackErrorHandler', async () => {
			const { exchangeName, event, subscriberName, handler, logger, channel, msg, error, getErrorHandler } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const errorHandler = getErrorHandler();
			await errorHandler(channel, msg, error);

			expect(mockDefaultNackErrorHandler).toHaveBeenCalledWith(channel, msg, error);
		});
	});

	describe('when a valid payload is received', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const handler = jest.fn().mockResolvedValue(undefined);
			const payload: TestPayload = { value: 'test-value' };
			const logger = createMock<Logger>();

			let subscriberCallback: (payload: TestPayload) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((callback: any) => {
				subscriberCallback = callback;

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				payload,
				getSubscriberCallback: () => subscriberCallback,
				logger,
			};
		};

		it('should call the handler with the payload', async () => {
			const { exchangeName, event, subscriberName, handler, payload, getSubscriberCallback, logger } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const subscriberCallback = getSubscriberCallback();
			await subscriberCallback(payload);

			expect(handler).toHaveBeenCalledWith(payload);
		});
	});

	describe('when an empty payload is received', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const handler = jest.fn().mockResolvedValue(undefined);
			const logger = createMock<Logger>();

			let subscriberCallback: (payload: TestPayload | null | undefined) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((callback: any) => {
				subscriberCallback = callback;

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				getSubscriberCallback: () => subscriberCallback,
				logger,
			};
		};

		it('should log an error when payload is null', async () => {
			const { exchangeName, event, subscriberName, handler, getSubscriberCallback, logger } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const subscriberCallback = getSubscriberCallback();
			await subscriberCallback(null);

			expect(logger.warning).toHaveBeenCalled();
			expect(handler).not.toHaveBeenCalled();
		});

		it('should log an error when payload is undefined', async () => {
			const { exchangeName, event, subscriberName, handler, getSubscriberCallback, logger } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName, logger);

			const subscriberCallback = getSubscriberCallback();
			await subscriberCallback(undefined);

			expect(logger.warning).toHaveBeenCalled();
			expect(handler).not.toHaveBeenCalled();
		});
	});
});
