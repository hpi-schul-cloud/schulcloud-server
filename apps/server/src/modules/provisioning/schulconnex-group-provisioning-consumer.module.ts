import { LoggerModule } from '@core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { SchulconnexGroupProvisioningConsumer } from './consumer';

@Module({
	imports: [LoggerModule, RabbitMQWrapperModule],
	providers: [SchulconnexGroupProvisioningConsumer],
})
export class SchulconnexGroupProvisioningConsumerModule {}
