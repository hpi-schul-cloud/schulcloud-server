import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export const registerAmqpSubscriber = async <T>(
	amqpConnection: AmqpConnection,
	exchangeName: string,
	event: string,
	handler: (payload: T) => Promise<void>,
	subscriberName: string
): Promise<void> => {
	await amqpConnection.createSubscriber<T>(
		(payload) => {
			if (!payload) {
				throw new Error(`Received empty payload for ${event} event`);
			}

			return handler(payload);
		},
		{
			exchange: exchangeName,
			routingKey: event,
			queue: event,
		},
		subscriberName
	);
};
