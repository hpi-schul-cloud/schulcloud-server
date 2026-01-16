import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexGroupRemovalMessage } from '../domain';
import { GroupRemovalSuccessfulLoggable } from '../loggable';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';

@Injectable()
export class SchulconnexGroupRemovalConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexGroupRemovalConsumer.name);
	}

	@RabbitSubscribe({
		exchange: SchulconnexProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_REMOVAL,
		queue: SchulconnexProvisioningEvents.GROUP_REMOVAL,
	})
	@UseRequestContext()
	public async removeUserFromGroup(
		@RabbitPayload()
		payload: SchulconnexGroupRemovalMessage
	): Promise<void> {
		const removedFromGroup: Group | null = await this.schulconnexGroupProvisioningService.removeUserFromGroup(
			payload.userId,
			payload.groupId
		);

		if (this.config.featureSchulconnexCourseSyncEnabled && removedFromGroup) {
			await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(removedFromGroup, removedFromGroup);
		}

		this.logger.info(new GroupRemovalSuccessfulLoggable(payload.groupId, payload.userId, !removedFromGroup));
	}
}
