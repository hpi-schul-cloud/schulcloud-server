import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { type Group } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage, SchulconnexGroupRemovalMessage } from '../domain';
import { GroupProvisioningSuccessfulLoggable, GroupRemovalSuccessfulLoggable } from '../loggable';
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
		exchange: SchulconnexProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
		queue: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
	})
	public async provisionGroups(
		@RabbitPayload()
		payload: SchulconnexGroupProvisioningMessage
	): Promise<void> {
		const group: Group | null = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
			payload.externalGroup,
			payload.externalSchool,
			payload.systemId
		);

		if (group) {
			this.logger.info(
				new GroupProvisioningSuccessfulLoggable(group.id, payload.externalGroup.externalId, payload.systemId)
			);
		}
	}

	@RabbitSubscribe({
		exchange: SchulconnexProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_REMOVAL,
		queue: SchulconnexProvisioningEvents.GROUP_REMOVAL,
	})
	public async removeUserFromGroup(
		@RabbitPayload()
		payload: SchulconnexGroupRemovalMessage
	): Promise<void> {
		const groupDeleted: boolean = await this.schulconnexGroupProvisioningService.removeUserFromGroup(
			payload.userId,
			payload.groupId
		);

		this.logger.info(new GroupRemovalSuccessfulLoggable(payload.groupId, payload.userId, groupDeleted));
	}
}
