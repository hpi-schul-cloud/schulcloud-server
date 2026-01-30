import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage, SchulconnexGroupRemovalMessage } from '../domain';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexGroupProvisioningProducer {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly config: InternalProvisioningExchangeConfig
	) {}

	public async provisonGroup(message: SchulconnexGroupProvisioningMessage): Promise<void> {
		await this.amqpConnection.publish(
			this.config.exchangeName,
			SchulconnexProvisioningEvents.GROUP_PROVISIONING,
			message
		);
	}

	public async removeUserFromGroup(message: SchulconnexGroupRemovalMessage): Promise<void> {
		await this.amqpConnection.publish(this.config.exchangeName, SchulconnexProvisioningEvents.GROUP_REMOVAL, message);
	}
}
