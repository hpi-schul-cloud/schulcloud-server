import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexLicenseProvisioningMessage } from '../domain';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexLicenseProvisioningProducer {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly config: InternalProvisioningExchangeConfig
	) {}

	public async provisonLicenses(message: SchulconnexLicenseProvisioningMessage): Promise<void> {
		await this.amqpConnection.publish(
			this.config.exchangeName,
			SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
			message
		);
	}
}
