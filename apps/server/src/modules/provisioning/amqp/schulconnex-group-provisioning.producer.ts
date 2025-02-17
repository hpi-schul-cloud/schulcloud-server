import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage, SchulconnexGroupRemovalMessage } from '../domain';

@Injectable()
export class SchulconnexGroupProvisioningProducer {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async provisonGroup(message: SchulconnexGroupProvisioningMessage): Promise<void> {
		await this.amqpConnection.publish(
			SchulconnexProvisioningExchange,
			SchulconnexProvisioningEvents.GROUP_PROVISIONING,
			message
		);
	}

	public async removeUserFromGroup(message: SchulconnexGroupRemovalMessage): Promise<void> {
		await this.amqpConnection.publish(
			SchulconnexProvisioningExchange,
			SchulconnexProvisioningEvents.GROUP_REMOVAL,
			message
		);
	}
}
