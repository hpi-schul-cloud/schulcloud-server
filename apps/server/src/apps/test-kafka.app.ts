/* istanbul ignore file */
/* eslint-disable no-console */
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EventPattern, MicroserviceOptions, Payload, Transport } from '@nestjs/microservices';
import { install as sourceMapInstall } from 'source-map-support';

class KafkaConsumer {
	@EventPattern('test-topic')
	public deleteFile(@Payload() message: unknown): void {
		console.log('Received event on test-topic:', JSON.stringify(message));
	}
}

@Module({
	imports: [KafkaModule],
	controllers: [KafkaConsumer],
})
class KafkaModule {}

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const app = await NestFactory.createMicroservice<MicroserviceOptions>(KafkaModule, {
		transport: Transport.KAFKA,
		options: {
			client: {
				clientId: 'test-kafka',
				brokers: ['localhost:9092'],
			},
			consumer: {
				groupId: 'test-kafka-consumer',
			},
		},
	});

	await app.listen();

	console.log('#########################################');
	console.log(`### Start Core Server Test Kafka Consumer          ###`);
	console.log(`### Listening on Kafka topics          ###`);
	console.log('#########################################');
}
void bootstrap();
