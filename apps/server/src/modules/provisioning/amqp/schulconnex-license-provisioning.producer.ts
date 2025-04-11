import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { SchulconnexLicenseProvisioningMessage } from '../domain';

@Injectable()
export class SchulconnexLicenseProvisioningProducer {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async provisonLicenses(message: SchulconnexLicenseProvisioningMessage): Promise<void> {
		await this.amqpConnection.publish(
			SchulconnexProvisioningExchange,
			SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
			message
		);
	}
}
