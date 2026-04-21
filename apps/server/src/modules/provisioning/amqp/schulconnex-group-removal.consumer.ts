import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { type Group } from '@modules/group';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SchulconnexGroupRemovalMessage } from '../domain';
import { GroupRemovalSuccessfulLoggable } from '../loggable';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';
import { registerAmqpSubscriber } from './amqp-subscriber.helper';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexGroupRemovalConsumer implements OnModuleInit {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly exchangeConfig: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM,
		private readonly amqpConnection: AmqpConnection
	) {
		this.logger.setContext(SchulconnexGroupRemovalConsumer.name);
	}

	public async onModuleInit(): Promise<void> {
		await registerAmqpSubscriber(
			this.amqpConnection,
			this.exchangeConfig.exchangeName,
			SchulconnexProvisioningEvents.GROUP_REMOVAL,
			(payload: SchulconnexGroupRemovalMessage) => this.removeUserFromGroup(payload),
			SchulconnexGroupRemovalConsumer.name
		);
	}

	public async removeUserFromGroup(payload: SchulconnexGroupRemovalMessage): Promise<void> {
		await RequestContext.create(this.orm.em, async () => {
			const removedFromGroup: Group | null = await this.schulconnexGroupProvisioningService.removeUserFromGroup(
				payload.userId,
				payload.groupId
			);

			if (this.config.featureSchulconnexCourseSyncEnabled && removedFromGroup) {
				await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(removedFromGroup, removedFromGroup);
			}

			this.logger.info(new GroupRemovalSuccessfulLoggable(payload.groupId, payload.userId, !removedFromGroup));
		});
	}
}
