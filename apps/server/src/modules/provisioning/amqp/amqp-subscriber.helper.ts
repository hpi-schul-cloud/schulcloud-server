import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { AmqpConnection, defaultNackErrorHandler } from '@golevelup/nestjs-rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

export const registerAmqpSubscriber = async <T>(
	amqpConnection: AmqpConnection,
	exchangeName: string,
	event: string,
	handler: (payload: T) => Promise<void>,
	subscriberName: string,
	logger: Logger
): Promise<void> => {
	const logAndNackErrorHandler = async (channel: Channel, msg: ConsumeMessage, error: unknown): Promise<void> => {
		logger.warning(new ErrorLoggable(error, { msg: 'AMQP subscriber handler error' }));
		await defaultNackErrorHandler(channel, msg, error);
	};

	await amqpConnection.createSubscriber<T>(
		async (payload) => {
			try {
				if (!payload) {
					throw new Error(`Received empty payload for ${event} event`);
				}

				await handler(payload);
			} catch (error) {
				logger.warning(new ErrorLoggable(error, { msg: 'AMQP subscriber handler error' }));
			}
		},
		{
			exchange: exchangeName,
			routingKey: event,
			queue: event,
			errorHandler: logAndNackErrorHandler,
		},
		subscriberName
	);
};
