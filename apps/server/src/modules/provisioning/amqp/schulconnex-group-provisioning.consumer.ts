import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { type Group, GroupService } from '@modules/group';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SchulconnexGroupProvisioningMessage } from '../domain';
import { GroupProvisioningSuccessfulLoggable } from '../loggable';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';
import { registerAmqpSubscriber } from './amqp-subscriber.helper';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexGroupProvisioningConsumer implements OnModuleInit {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		private readonly groupService: GroupService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly exchangeConfig: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM,
		private readonly amqpConnection: AmqpConnection
	) {
		this.logger.setContext(SchulconnexGroupProvisioningConsumer.name);
	}

	public async onModuleInit(): Promise<void> {
		await registerAmqpSubscriber(
			this.amqpConnection,
			this.exchangeConfig.exchangeName,
			SchulconnexProvisioningEvents.GROUP_PROVISIONING,
			(payload: SchulconnexGroupProvisioningMessage) => this.provisionGroups(payload),
			SchulconnexGroupProvisioningConsumer.name
		);
	}

	public async provisionGroups(payload: SchulconnexGroupProvisioningMessage): Promise<void> {
		await RequestContext.create(this.orm.em, async () => {
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
				await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(
					provisionedGroup,
					existingGroup ?? undefined
				);
				if (!existingGroup) {
					await this.schulconnexCourseSyncService.synchronizeCoursesFromHistory(provisionedGroup);
				}
			}

			if (provisionedGroup) {
				this.logger.info(
					new GroupProvisioningSuccessfulLoggable(
						provisionedGroup.id,
						payload.externalGroup.externalId,
						payload.systemId
					)
				);
			}
		});
	}
}
