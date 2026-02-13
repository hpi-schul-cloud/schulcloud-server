import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexGroupRemovalMessage } from '../domain';
import { GroupRemovalSuccessfulLoggable } from '../loggable';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

// Using a variable here to access the exchange name in the decorator
let provisionedExchangeName: string | undefined;
@Injectable()
export class SchulconnexGroupRemovalConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly exchangeConfig: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexGroupRemovalConsumer.name);
		provisionedExchangeName = this.exchangeConfig.exchangeName;
	}

	@RabbitSubscribe({
		exchange: provisionedExchangeName,
		routingKey: SchulconnexProvisioningEvents.GROUP_REMOVAL,
		queue: SchulconnexProvisioningEvents.GROUP_REMOVAL,
	})
	@EnsureRequestContext()
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
