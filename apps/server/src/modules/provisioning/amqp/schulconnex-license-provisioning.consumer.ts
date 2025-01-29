import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexLicenseProvisioningExchange, SchulconnexProvisioningEvents } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchulconnexLicenseProvisioningConsumer {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(SchulconnexLicenseProvisioningConsumer.name);
	}

	@RabbitSubscribe({
		exchange: SchulconnexLicenseProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
		queue: SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
	})
	public async provisionLicenses(@RabbitPayload() payload: unknown): Promise<void> {}
}
