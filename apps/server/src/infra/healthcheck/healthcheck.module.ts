import { DynamicModule, Module, Type } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AmqpConsumerHealthIndicator } from './indicators/amqp-consumer.indictor';

@Module({})
export class HealthCheckModule {
	static register(controllers?: Type<any>[]): DynamicModule {
		return {
			module: HealthCheckModule,
			imports: [TerminusModule],
			providers: [AmqpConsumerHealthIndicator],
			exports: [AmqpConsumerHealthIndicator],
			controllers,
		};
	}
}
