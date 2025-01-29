import { LoggerModule } from '@core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { SchulconnexLicenseProvisioningConsumer } from './amqp';

@Module({
	imports: [LoggerModule, RabbitMQWrapperModule],
	providers: [SchulconnexLicenseProvisioningConsumer],
})
export class SchulconnexLicenseProvisioningConsumerModule {}
