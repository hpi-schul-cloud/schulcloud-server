import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { registerAmqpSubscriber } from './amqp-subscriber.helper';

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

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
			};
		};

		it('should call createSubscriber with the correct parameters', async () => {
			const { exchangeName, event, subscriberName, handler } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName);

			expect(amqpConnection.createSubscriber).toHaveBeenCalledWith(
				expect.any(Function),
				{
					exchange: exchangeName,
					routingKey: event,
					queue: event,
				},
				subscriberName
			);
		});
	});

	describe('when a valid payload is received', () => {
		const setup = () => {
			const exchangeName = 'test-exchange';
			const event = 'test-event';
			const subscriberName = 'test-subscriber';
			const handler = jest.fn().mockResolvedValue(undefined);
			const payload: TestPayload = { value: 'test-value' };

			let subscriberCallback: (payload: TestPayload) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((callback: any) => {
				subscriberCallback = callback;

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				payload,
				getSubscriberCallback: () => subscriberCallback,
			};
		};

		it('should call the handler with the payload', async () => {
			const { exchangeName, event, subscriberName, handler, payload, getSubscriberCallback } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName);

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

			let subscriberCallback: (payload: TestPayload | null | undefined) => Promise<void>;

			/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
			amqpConnection.createSubscriber.mockImplementation(((callback: any) => {
				subscriberCallback = callback;

				return Promise.resolve({});
			}) as any);
			/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */

			return {
				exchangeName,
				event,
				subscriberName,
				handler,
				getSubscriberCallback: () => subscriberCallback,
			};
		};

		it('should throw an error when payload is null', async () => {
			const { exchangeName, event, subscriberName, handler, getSubscriberCallback } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName);

			const subscriberCallback = getSubscriberCallback();

			expect(() => subscriberCallback(null)).toThrow(`Received empty payload for ${event} event`);
			expect(handler).not.toHaveBeenCalled();
		});

		it('should throw an error when payload is undefined', async () => {
			const { exchangeName, event, subscriberName, handler, getSubscriberCallback } = setup();

			await registerAmqpSubscriber<TestPayload>(amqpConnection, exchangeName, event, handler, subscriberName);

			const subscriberCallback = getSubscriberCallback();

			expect(() => subscriberCallback(undefined)).toThrow(`Received empty payload for ${event} event`);
			expect(handler).not.toHaveBeenCalled();
		});
	});
});
