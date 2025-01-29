import { Loggable, Logger, LogMessage } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexGroupProvisioningExchange, SchulconnexProvisioningEvents } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage } from '../domain';
import { SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';

@Injectable()
export class SchulconnexGroupProvisioningConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService
	) {
		this.logger.setContext(SchulconnexGroupProvisioningConsumer.name);
	}

	@RabbitSubscribe({
		exchange: SchulconnexGroupProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
		queue: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
	})
	public async provisionGroups(
		@RabbitPayload()
		payload: SchulconnexGroupProvisioningMessage
	): Promise<void> {
		await this.schulconnexGroupProvisioningService.provisionExternalGroup(
			payload.externalGroup,
			payload.externalSchool,
			payload.systemId
		);

		this.logger.info(
			new (class Test implements Loggable {
				getLogMessage(): LogMessage {
					return {
						message: 'Group provisioning finished.',
					};
				}
			})()
		);
	}
}
