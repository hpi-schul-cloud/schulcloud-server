import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexGroupProvisioningExchange, SchulconnexProvisioningEvents } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchulconnexGroupProvisioningConsumer {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(SchulconnexGroupProvisioningConsumer.name);
	}

	@RabbitSubscribe({
		exchange: SchulconnexGroupProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
		queue: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
	})
	public async provisionGroups(@RabbitPayload() payload: unknown): Promise<void> {}
}
