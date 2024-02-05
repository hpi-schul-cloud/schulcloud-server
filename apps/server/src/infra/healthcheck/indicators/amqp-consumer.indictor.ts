import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

export class AmqpConsumerHealthIndicator extends HealthIndicator {
	private amqpConnection!: AmqpConnection;

	setAmqpConnection(connection: AmqpConnection) {
		this.amqpConnection = connection;
	}

	public isHealthy(key: string): HealthIndicatorResult {
		const { consumerTags, channels } = this.amqpConnection;
		console.log('CHANNELS', channels);
		console.log('CONSUMER_TAGS', consumerTags);

		const isHealthy = consumerTags.length > 0;

		const result = this.getStatus(key, isHealthy);

		if (isHealthy) {
			return result;
		}
		throw new HealthCheckError('Consumer check failed', result);
	}
}
