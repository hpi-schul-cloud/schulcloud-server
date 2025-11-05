import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
	constructor(@Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka) {}

	public async onModuleInit(): Promise<void> {
		await this.kafkaClient.connect();
	}

	public async onModuleDestroy(): Promise<void> {
		await this.kafkaClient.close();
	}

	public emitMessage(topic: string, message: unknown): void {
		this.kafkaClient.emit(topic, message);
	}
}
