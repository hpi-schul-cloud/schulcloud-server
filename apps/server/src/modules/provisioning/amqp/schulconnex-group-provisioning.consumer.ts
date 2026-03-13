import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { type Group, GroupService } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage } from '../domain';
import { GroupProvisioningSuccessfulLoggable } from '../loggable';
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
export class SchulconnexGroupProvisioningConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		private readonly groupService: GroupService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly exchangeConfig: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexGroupProvisioningConsumer.name);
		provisionedExchangeName = this.exchangeConfig.exchangeName;
	}

	@RabbitSubscribe({
		exchange: provisionedExchangeName,
		routingKey: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
		queue: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
	})
	@EnsureRequestContext()
	public async provisionGroups(
		@RabbitPayload()
		payload: SchulconnexGroupProvisioningMessage
	): Promise<void> {
		const existingGroup: Group | null = await this.groupService.findByExternalSource(
			payload.externalGroup.externalId,
			payload.systemId
		);

		const provisionedGroup: Group | null = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
			payload.externalGroup,
			payload.externalSchool,
			payload.systemId
		);

		if (this.config.featureSchulconnexCourseSyncEnabled && provisionedGroup) {
			await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(provisionedGroup, existingGroup ?? undefined);
			if (!existingGroup) {
				await this.schulconnexCourseSyncService.synchronizeCoursesFromHistory(provisionedGroup);
			}
		}

		if (provisionedGroup) {
			this.logger.info(
				new GroupProvisioningSuccessfulLoggable(provisionedGroup.id, payload.externalGroup.externalId, payload.systemId)
			);
		}
	}
}
