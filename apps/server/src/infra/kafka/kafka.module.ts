import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';

@Global()
@Module({
	imports: [
		ClientsModule.register([
			{
				name: 'KAFKA_CLIENT',
				transport: Transport.KAFKA,
				options: {
					client: {
						clientId: 'svs-server',
						brokers: ['localhost:9092'],
					},
					consumer: {
						groupId: 'svs-server-group',
					},
				},
			},
		]),
	],
	providers: [KafkaProducerService],
	exports: [KafkaProducerService],
})
export class KafkaModule {}
