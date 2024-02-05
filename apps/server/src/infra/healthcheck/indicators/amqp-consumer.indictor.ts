import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';

export class AmqpConsumerHealthIndicator extends HealthIndicator {
	private amqpConnection!: AmqpConnection;

	setAmqpConnection(connection: AmqpConnection) {
		this.amqpConnection = connection;
	}

	public isHealthy(key: string) {
		const { consumerTags, channel } = this.amqpConnection;

		console.log('CHANNEL', channel);
		console.log('CONSUMER_TAGS', consumerTags);

		const isHealthy = consumerTags.length > 0;

		const result = this.getStatus(key, isHealthy);

		if (isHealthy) {
			return result;
		}
		throw new HealthCheckError('Consumer check failed', result);
	}
}
